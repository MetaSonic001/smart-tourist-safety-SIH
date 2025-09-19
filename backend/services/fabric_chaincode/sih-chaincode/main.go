package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"regexp"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// SIHChaincode provides functions for managing Digital IDs, incidents, and evidence
type SIHChaincode struct {
	contractapi.Contract
}

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

// QueryResult structure used for handling result of query
type QueryResult struct {
	Key    string      `json:"Key"`
	Record interface{} `json:"Record"`
}

// IssueDID creates a new Digital ID document
func (s *SIHChaincode) IssueDID(ctx contractapi.TransactionContextInterface, digitalID string, consentHash string, issuedAt string, expiresAt string, issuer string) (string, error) {
	// Input validation
	if len(digitalID) == 0 {
		return "", fmt.Errorf("digitalID cannot be empty")
	}
	if len(consentHash) == 0 {
		return "", fmt.Errorf("consentHash cannot be empty")
	}
	if len(issuer) == 0 {
		return "", fmt.Errorf("issuer cannot be empty")
	}

	// Validate hash format (SHA-256 hex)
	sha256Regex := regexp.MustCompile(`^[a-f0-9]{64}$`)
	if !sha256Regex.MatchString(consentHash) {
		return "", fmt.Errorf("consentHash must be a valid SHA-256 hash (64 hex characters)")
	}

	// Validate timestamp format
	if _, err := time.Parse(time.RFC3339, issuedAt); err != nil {
		return "", fmt.Errorf("issuedAt must be in RFC3339 format: %v", err)
	}
	if _, err := time.Parse(time.RFC3339, expiresAt); err != nil {
		return "", fmt.Errorf("expiresAt must be in RFC3339 format: %v", err)
	}

	key := fmt.Sprintf("DID#%s", digitalID)

	// Check if DID already exists (idempotency)
	existingDIDBytes, err := ctx.GetStub().GetState(key)
	if err != nil {
		return "", fmt.Errorf("failed to read from world state: %v", err)
	}

	if existingDIDBytes != nil {
		var existingDID DIDDocument
		err := json.Unmarshal(existingDIDBytes, &existingDID)
		if err != nil {
			return "", fmt.Errorf("failed to unmarshal existing DID: %v", err)
		}
		log.Printf("WARNING: DID %s already exists with TxID %s", digitalID, existingDID.TxID)
		return existingDID.TxID, nil
	}

	txID := ctx.GetStub().GetTxID()

	did := DIDDocument{
		DocType:     "DID",
		DigitalID:   digitalID,
		ConsentHash: consentHash,
		IssuedAt:    issuedAt,
		ExpiresAt:   expiresAt,
		Issuer:      issuer,
		TxID:        txID,
	}

	didJSON, err := json.Marshal(did)
	if err != nil {
		return "", fmt.Errorf("failed to marshal DID: %v", err)
	}

	err = ctx.GetStub().PutState(key, didJSON)
	if err != nil {
		return "", fmt.Errorf("failed to put DID to world state: %v", err)
	}

	return txID, nil
}

// VerifyDID retrieves and returns a Digital ID document
func (s *SIHChaincode) VerifyDID(ctx contractapi.TransactionContextInterface, digitalID string) (*DIDDocument, error) {
	if len(digitalID) == 0 {
		return nil, fmt.Errorf("digitalID cannot be empty")
	}

	key := fmt.Sprintf("DID#%s", digitalID)
	didBytes, err := ctx.GetStub().GetState(key)
	if err != nil {
		return nil, fmt.Errorf("failed to read DID from world state: %v", err)
	}

	if didBytes == nil {
		return nil, fmt.Errorf("DID %s not found", digitalID)
	}

	var did DIDDocument
	err = json.Unmarshal(didBytes, &did)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal DID: %v", err)
	}

	return &did, nil
}

// RecordIncident creates a new incident record
func (s *SIHChaincode) RecordIncident(ctx contractapi.TransactionContextInterface, incidentID string, incidentSummaryHash string, createdAt string, reporter string) (string, error) {
	// Input validation
	if len(incidentID) == 0 {
		return "", fmt.Errorf("incidentID cannot be empty")
	}
	if len(incidentSummaryHash) == 0 {
		return "", fmt.Errorf("incidentSummaryHash cannot be empty")
	}
	if len(reporter) == 0 {
		return "", fmt.Errorf("reporter cannot be empty")
	}

	// Validate hash format
	sha256Regex := regexp.MustCompile(`^[a-f0-9]{64}$`)
	if !sha256Regex.MatchString(incidentSummaryHash) {
		return "", fmt.Errorf("incidentSummaryHash must be a valid SHA-256 hash")
	}

	// Validate timestamp
	if _, err := time.Parse(time.RFC3339, createdAt); err != nil {
		return "", fmt.Errorf("createdAt must be in RFC3339 format: %v", err)
	}

	key := fmt.Sprintf("INC#%s", incidentID)

	// Check if incident already exists
	existingIncidentBytes, err := ctx.GetStub().GetState(key)
	if err != nil {
		return "", fmt.Errorf("failed to read from world state: %v", err)
	}

	if existingIncidentBytes != nil {
		return "", fmt.Errorf("incident %s already exists", incidentID)
	}

	txID := ctx.GetStub().GetTxID()

	incident := IncidentDocument{
		DocType:             "INC",
		IncidentID:          incidentID,
		IncidentSummaryHash: incidentSummaryHash,
		CreatedAt:           createdAt,
		Reporter:            reporter,
		TxID:                txID,
	}

	incidentJSON, err := json.Marshal(incident)
	if err != nil {
		return "", fmt.Errorf("failed to marshal incident: %v", err)
	}

	err = ctx.GetStub().PutState(key, incidentJSON)
	if err != nil {
		return "", fmt.Errorf("failed to put incident to world state: %v", err)
	}

	return txID, nil
}

// AnchorEvidence anchors evidence to an incident
func (s *SIHChaincode) AnchorEvidence(ctx contractapi.TransactionContextInterface, evidenceHash string, incidentID string, mediaType string, uploadedBy string) (string, error) {
	// Input validation
	if len(evidenceHash) == 0 {
		return "", fmt.Errorf("evidenceHash cannot be empty")
	}
	if len(incidentID) == 0 {
		return "", fmt.Errorf("incidentID cannot be empty")
	}
	if len(uploadedBy) == 0 {
		return "", fmt.Errorf("uploadedBy cannot be empty")
	}

	// Validate evidence hash format
	sha256Regex := regexp.MustCompile(`^[a-f0-9]{64}$`)
	if !sha256Regex.MatchString(evidenceHash) {
		return "", fmt.Errorf("evidenceHash must be a valid SHA-256 hash")
	}

	// Verify incident exists
	incidentKey := fmt.Sprintf("INC#%s", incidentID)
	incidentBytes, err := ctx.GetStub().GetState(incidentKey)
	if err != nil {
		return "", fmt.Errorf("failed to read incident from world state: %v", err)
	}
	if incidentBytes == nil {
		return "", fmt.Errorf("incident %s not found", incidentID)
	}

	evidenceKey := fmt.Sprintf("EVID#%s", evidenceHash)

	// Check if evidence already exists
	existingEvidenceBytes, err := ctx.GetStub().GetState(evidenceKey)
	if err != nil {
		return "", fmt.Errorf("failed to read from world state: %v", err)
	}

	if existingEvidenceBytes != nil {
		return "", fmt.Errorf("evidence %s already exists", evidenceHash)
	}

	txID := ctx.GetStub().GetTxID()
	createdAt := time.Now().UTC().Format(time.RFC3339)

	evidence := EvidenceDocument{
		DocType:      "EVID",
		EvidenceHash: evidenceHash,
		IncidentID:   incidentID,
		MediaType:    mediaType,
		UploadedBy:   uploadedBy,
		CreatedAt:    createdAt,
		TxID:         txID,
	}

	evidenceJSON, err := json.Marshal(evidence)
	if err != nil {
		return "", fmt.Errorf("failed to marshal evidence: %v", err)
	}

	err = ctx.GetStub().PutState(evidenceKey, evidenceJSON)
	if err != nil {
		return "", fmt.Errorf("failed to put evidence to world state: %v", err)
	}

	return txID, nil
}

// AppendAudit creates an audit log entry
func (s *SIHChaincode) AppendAudit(ctx contractapi.TransactionContextInterface, auditHash string, actor string, action string, targetID string) (string, error) {
	// Input validation
	if len(actor) == 0 {
		return "", fmt.Errorf("actor cannot be empty")
	}
	if len(action) == 0 {
		return "", fmt.Errorf("action cannot be empty")
	}
	if len(targetID) == 0 {
		return "", fmt.Errorf("targetID cannot be empty")
	}

	// Generate audit hash if not provided
	if len(auditHash) == 0 {
		// Create hash from actor + action + targetID + timestamp
		timestamp := time.Now().UTC().Format(time.RFC3339Nano)
		hashInput := fmt.Sprintf("%s%s%s%s", actor, action, targetID, timestamp)
		hash := sha256.Sum256([]byte(hashInput))
		auditHash = hex.EncodeToString(hash[:])
	} else {
		// Validate provided hash format
		sha256Regex := regexp.MustCompile(`^[a-f0-9]{64}$`)
		if !sha256Regex.MatchString(auditHash) {
			return "", fmt.Errorf("auditHash must be a valid SHA-256 hash")
		}
	}

	auditKey := fmt.Sprintf("AUDIT#%s", auditHash)

	// Check if audit entry already exists
	existingAuditBytes, err := ctx.GetStub().GetState(auditKey)
	if err != nil {
		return "", fmt.Errorf("failed to read from world state: %v", err)
	}

	if existingAuditBytes != nil {
		return "", fmt.Errorf("audit entry %s already exists", auditHash)
	}

	txID := ctx.GetStub().GetTxID()
	timestamp := time.Now().UTC().Format(time.RFC3339)

	audit := AuditDocument{
		DocType:   "AUDIT",
		AuditHash: auditHash,
		Actor:     actor,
		Action:    action,
		TargetID:  targetID,
		Timestamp: timestamp,
		TxID:      txID,
	}

	auditJSON, err := json.Marshal(audit)
	if err != nil {
		return "", fmt.Errorf("failed to marshal audit: %v", err)
	}

	err = ctx.GetStub().PutState(auditKey, auditJSON)
	if err != nil {
		return "", fmt.Errorf("failed to put audit to world state: %v", err)
	}

	return txID, nil
}

// QueryIncidentsByTimeRange retrieves incidents within a time range
func (s *SIHChaincode) QueryIncidentsByTimeRange(ctx contractapi.TransactionContextInterface, startTime string, endTime string) ([]*IncidentDocument, error) {
	// Validate timestamps
	if _, err := time.Parse(time.RFC3339, startTime); err != nil {
		return nil, fmt.Errorf("startTime must be in RFC3339 format: %v", err)
	}
	if _, err := time.Parse(time.RFC3339, endTime); err != nil {
		return nil, fmt.Errorf("endTime must be in RFC3339 format: %v", err)
	}

	queryString := fmt.Sprintf(`{
		"selector": {
			"doc_type": "INC",
			"created_at": {
				"$gte": "%s",
				"$lte": "%s"
			}
		}
	}`, startTime, endTime)

	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, fmt.Errorf("failed to execute query: %v", err)
	}
	defer resultsIterator.Close()

	var incidents []*IncidentDocument
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, fmt.Errorf("failed to get next query result: %v", err)
		}

		var incident IncidentDocument
		err = json.Unmarshal(queryResponse.Value, &incident)
		if err != nil {
			return nil, fmt.Errorf("failed to unmarshal incident: %v", err)
		}
		incidents = append(incidents, &incident)
	}

	return incidents, nil
}

// QueryEvidenceByIncident retrieves all evidence for a specific incident
func (s *SIHChaincode) QueryEvidenceByIncident(ctx contractapi.TransactionContextInterface, incidentID string) ([]*EvidenceDocument, error) {
	if len(incidentID) == 0 {
		return nil, fmt.Errorf("incidentID cannot be empty")
	}

	queryString := fmt.Sprintf(`{
		"selector": {
			"doc_type": "EVID",
			"incident_id": "%s"
		}
	}`, incidentID)

	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, fmt.Errorf("failed to execute query: %v", err)
	}
	defer resultsIterator.Close()

	var evidence []*EvidenceDocument
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, fmt.Errorf("failed to get next query result: %v", err)
		}

		var evidenceDoc EvidenceDocument
		err = json.Unmarshal(queryResponse.Value, &evidenceDoc)
		if err != nil {
			return nil, fmt.Errorf("failed to unmarshal evidence: %v", err)
		}
		evidence = append(evidence, &evidenceDoc)
	}

	return evidence, nil
}

// GetAllDocuments retrieves all documents by type (for testing purposes)
func (s *SIHChaincode) GetAllDocuments(ctx contractapi.TransactionContextInterface, docType string) ([]QueryResult, error) {
	queryString := fmt.Sprintf(`{
		"selector": {
			"doc_type": "%s"
		}
	}`, docType)

	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, fmt.Errorf("failed to execute query: %v", err)
	}
	defer resultsIterator.Close()

	var results []QueryResult
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, fmt.Errorf("failed to get next query result: %v", err)
		}

		var document interface{}
		err = json.Unmarshal(queryResponse.Value, &document)
		if err != nil {
			return nil, fmt.Errorf("failed to unmarshal document: %v", err)
		}

		queryResult := QueryResult{
			Key:    queryResponse.Key,
			Record: document,
		}
		results = append(results, queryResult)
	}

	return results, nil
}

func main() {
	sihChaincode, err := contractapi.NewChaincode(&SIHChaincode{})
	if err != nil {
		log.Panicf("Error creating SIH chaincode: %v", err)
	}

	if err := sihChaincode.Start(); err != nil {
		log.Panicf("Error starting SIH chaincode: %v", err)
	}
}
