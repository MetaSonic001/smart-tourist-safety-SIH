/*
Copyright 2022 IBM All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
*/

package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/hyperledger/fabric-gateway/pkg/client"
	"github.com/hyperledger/fabric-gateway/pkg/hash"
)

const (
	channelName   = "mychannel"
	chaincodeName = "sihcc"
)

var (
	contract *client.Contract
	network  *client.Network
)

// DIDDocument represents a Digital ID document
type DIDDocument struct {
	DocType     string `json:"doc_type"`
	DigitalID   string `json:"digital_id"`
	ConsentHash string `json:"consent_hash"`
	IssuedAt    string `json:"issued_at"`
	ExpiresAt   string `json:"expires_at"`
	Issuer      string `json:"issuer"`
	TxID        string `json:"tx_id"`
}

// IncidentDocument represents an incident record
type IncidentDocument struct {
	DocType             string `json:"doc_type"`
	IncidentID          string `json:"incident_id"`
	IncidentSummaryHash string `json:"incident_summary_hash"`
	CreatedAt           string `json:"created_at"`
	Reporter            string `json:"reporter"`
	TxID                string `json:"tx_id"`
}

// EvidenceDocument represents evidence anchored to an incident
type EvidenceDocument struct {
	DocType      string `json:"doc_type"`
	EvidenceHash string `json:"evidence_hash"`
	IncidentID   string `json:"incident_id"`
	MediaType    string `json:"media_type"`
	UploadedBy   string `json:"uploaded_by"`
	CreatedAt    string `json:"created_at"`
	TxID         string `json:"tx_id"`
}

// AuditDocument represents an audit log entry
type AuditDocument struct {
	DocType   string `json:"doc_type"`
	AuditHash string `json:"audit_hash"`
	Actor     string `json:"actor"`
	Action    string `json:"action"`
	TargetID  string `json:"target_id"`
	Timestamp string `json:"timestamp"`
	TxID      string `json:"tx_id"`
}

// Request structs for API
type CreateDIDRequest struct {
	DigitalID   string `json:"digitalID" binding:"required"`
	ConsentHash string `json:"consentHash" binding:"required"`
	ExpiresAt   string `json:"expiresAt" binding:"required"`
	Issuer      string `json:"issuer" binding:"required"`
}

type UpdateDIDRequest struct {
	ConsentHash string `json:"consentHash" binding:"required"`
	ExpiresAt   string `json:"expiresAt" binding:"required"`
	Updater     string `json:"updater" binding:"required"`
}

type DeleteRequest struct {
	Actor string `json:"actor" binding:"required"`
}

type CreateIncidentRequest struct {
	IncidentID          string `json:"incidentID" binding:"required"`
	IncidentSummaryHash string `json:"incidentSummaryHash" binding:"required"`
	Reporter            string `json:"reporter" binding:"required"`
}

type UpdateIncidentRequest struct {
	IncidentSummaryHash string `json:"incidentSummaryHash" binding:"required"`
	Updater             string `json:"updater" binding:"required"`
}

type CreateEvidenceRequest struct {
	EvidenceID   string `json:"evidenceID" binding:"required"`
	EvidenceHash string `json:"evidenceHash" binding:"required"`
	IncidentID   string `json:"incidentID" binding:"required"`
	MediaType    string `json:"mediaType" binding:"required"`
	UploadedBy   string `json:"uploadedBy" binding:"required"`
}

type UpdateEvidenceRequest struct {
	EvidenceHash string `json:"evidenceHash" binding:"required"`
	MediaType    string `json:"mediaType" binding:"required"`
	Updater      string `json:"updater" binding:"required"`
}

func main() {
	// Initialize Fabric Gateway connection
	initFabricConnection()
	defer closeFabricConnection()

	// Start chaincode event listening
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go startChaincodeEventListening(ctx, network)

	// Setup Gin router
	r := setupRouter()

	// Start server
	log.Println("🚀 SIH Chaincode API Server starting on :8080")
	log.Fatal(r.Run(":8080"))
}

func initFabricConnection() {
	clientConnection := newGrpcConnection()

	id := newIdentity()
	sign := newSign()

	gateway, err := client.Connect(
		id,
		client.WithSign(sign),
		client.WithHash(hash.SHA256),
		client.WithClientConnection(clientConnection),
		client.WithEvaluateTimeout(5*time.Second),
		client.WithEndorseTimeout(15*time.Second),
		client.WithSubmitTimeout(5*time.Second),
		client.WithCommitStatusTimeout(1*time.Minute),
	)
	if err != nil {
		panic(fmt.Errorf("failed to connect to gateway: %w", err))
	}

	network = gateway.GetNetwork(channelName)
	contract = network.GetContract(chaincodeName)

	log.Println("✅ Connected to Hyperledger Fabric network")
}

func closeFabricConnection() {
	log.Println("🔌 Closing Fabric connection...")
}

func setupRouter() *gin.Engine {
	gin.SetMode(gin.ReleaseMode)
	r := gin.Default()

	// CORS middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":    "OK",
			"message":   "SIH Chaincode API is running",
			"timestamp": time.Now().Format(time.RFC3339),
			"version":   "1.0.0",
		})
	})

	// API routes
	api := r.Group("/api/v1")
	{
		// DID routes
		did := api.Group("/did")
		{
			did.POST("/", createDID)
			did.GET("/:id", getDID)
			did.PUT("/:id", updateDID)
			did.DELETE("/:id", deleteDID)
		}

		// Incident routes
		incident := api.Group("/incident")
		{
			incident.POST("/", createIncident)
			incident.GET("/:id", getIncident)
			incident.PUT("/:id", updateIncident)
			incident.DELETE("/:id", deleteIncident)
		}

		// Evidence routes
		evidence := api.Group("/evidence")
		{
			evidence.POST("/", createEvidence)
			evidence.GET("/:id", getEvidence)
			evidence.PUT("/:id", updateEvidence)
			evidence.DELETE("/:id", deleteEvidence)
			evidence.GET("/incident/:incidentId", getEvidenceByIncident)
		}

		// Audit routes
		audit := api.Group("/audit")
		{
			audit.GET("/:targetId", getAuditsByTarget)
		}
	}

	return r
}

// DID CRUD Operations
func createDID(c *gin.Context) {
	var req CreateDIDRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err := contract.SubmitTransaction("CreateDID", req.DigitalID, req.ConsentHash, req.ExpiresAt, req.Issuer)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to create DID: %v", err)})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success":   true,
		"message":   "DID created successfully",
		"digitalID": req.DigitalID,
	})
}

func getDID(c *gin.Context) {
	id := c.Param("id")

	result, err := contract.EvaluateTransaction("ReadDID", id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("Failed to read DID: %v", err)})
		return
	}

	var did DIDDocument
	if err := json.Unmarshal(result, &did); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse DID data"})
		return
	}

	c.JSON(http.StatusOK, did)
}

func updateDID(c *gin.Context) {
	id := c.Param("id")
	var req UpdateDIDRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err := contract.SubmitTransaction("UpdateDID", id, req.ConsentHash, req.ExpiresAt, req.Updater)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to update DID: %v", err)})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"message":   "DID updated successfully",
		"digitalID": id,
	})
}

func deleteDID(c *gin.Context) {
	id := c.Param("id")
	var req DeleteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err := contract.SubmitTransaction("DeleteDID", id, req.Actor)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to delete DID: %v", err)})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"message":   "DID deleted successfully",
		"digitalID": id,
	})
}

// Incident CRUD Operations
func createIncident(c *gin.Context) {
	var req CreateIncidentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err := contract.SubmitTransaction("CreateIncident", req.IncidentID, req.IncidentSummaryHash, req.Reporter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to create incident: %v", err)})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success":    true,
		"message":    "Incident created successfully",
		"incidentID": req.IncidentID,
	})
}

func getIncident(c *gin.Context) {
	id := c.Param("id")

	result, err := contract.EvaluateTransaction("ReadIncident", id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("Failed to read incident: %v", err)})
		return
	}

	var incident IncidentDocument
	if err := json.Unmarshal(result, &incident); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse incident data"})
		return
	}

	c.JSON(http.StatusOK, incident)
}

func updateIncident(c *gin.Context) {
	id := c.Param("id")
	var req UpdateIncidentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err := contract.SubmitTransaction("UpdateIncident", id, req.IncidentSummaryHash, req.Updater)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to update incident: %v", err)})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"message":    "Incident updated successfully",
		"incidentID": id,
	})
}

func deleteIncident(c *gin.Context) {
	id := c.Param("id")
	var req DeleteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err := contract.SubmitTransaction("DeleteIncident", id, req.Actor)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to delete incident: %v", err)})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"message":    "Incident deleted successfully",
		"incidentID": id,
	})
}

// Evidence CRUD Operations
func createEvidence(c *gin.Context) {
	var req CreateEvidenceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err := contract.SubmitTransaction("CreateEvidence", req.EvidenceID, req.EvidenceHash, req.IncidentID, req.MediaType, req.UploadedBy)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to create evidence: %v", err)})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success":    true,
		"message":    "Evidence created successfully",
		"evidenceID": req.EvidenceID,
	})
}

func getEvidence(c *gin.Context) {
	id := c.Param("id")

	result, err := contract.EvaluateTransaction("ReadEvidence", id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("Failed to read evidence: %v", err)})
		return
	}

	var evidence EvidenceDocument
	if err := json.Unmarshal(result, &evidence); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse evidence data"})
		return
	}

	c.JSON(http.StatusOK, evidence)
}

func updateEvidence(c *gin.Context) {
	id := c.Param("id")
	var req UpdateEvidenceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err := contract.SubmitTransaction("UpdateEvidence", id, req.EvidenceHash, req.MediaType, req.Updater)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to update evidence: %v", err)})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"message":    "Evidence updated successfully",
		"evidenceID": id,
	})
}

func deleteEvidence(c *gin.Context) {
	id := c.Param("id")
	var req DeleteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_, err := contract.SubmitTransaction("DeleteEvidence", id, req.Actor)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to delete evidence: %v", err)})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"message":    "Evidence deleted successfully",
		"evidenceID": id,
	})
}

func getEvidenceByIncident(c *gin.Context) {
	incidentId := c.Param("incidentId")

	result, err := contract.EvaluateTransaction("GetEvidenceByIncident", incidentId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to get evidence by incident: %v", err)})
		return
	}

	var evidenceList []EvidenceDocument
	if err := json.Unmarshal(result, &evidenceList); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse evidence list data"})
		return
	}

	c.JSON(http.StatusOK, evidenceList)
}

// Audit Operations
func getAuditsByTarget(c *gin.Context) {
	targetId := c.Param("targetId")

	result, err := contract.EvaluateTransaction("GetAuditsByTarget", targetId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to get audit logs: %v", err)})
		return
	}

	var auditList []AuditDocument
	if err := json.Unmarshal(result, &auditList); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse audit list data"})
		return
	}

	c.JSON(http.StatusOK, auditList)
}

func startChaincodeEventListening(ctx context.Context, network *client.Network) {
	log.Println("📡 Starting chaincode event listening...")

	events, err := network.ChaincodeEvents(ctx, chaincodeName)
	if err != nil {
		log.Printf("Failed to start chaincode event listening: %v", err)
		return
	}

	for event := range events {
		asset := formatJSON(event.Payload)
		log.Printf("🎯 Chaincode event received: %s - %s", event.EventName, asset)
	}
}

func formatJSON(data []byte) string {
	var result bytes.Buffer
	if err := json.Indent(&result, data, "", "  "); err != nil {
		return string(data)
	}
	return result.String()
}
