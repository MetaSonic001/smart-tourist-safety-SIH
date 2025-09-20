package chaincode

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/v2/contractapi"
)

// SIHChaincode provides functions for managing Digital IDs, incidents, evidence, and audit logs
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

// Helper function to read state from ledger
func (s *SIHChaincode) readState(ctx contractapi.TransactionContextInterface, id string) ([]byte, error) {
	dataJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %w", err)
	}
	if dataJSON == nil {
		return nil, fmt.Errorf("the document %s does not exist", id)
	}
	return dataJSON, nil
}

// Helper function to create audit log
func (s *SIHChaincode) createAuditLog(ctx contractapi.TransactionContextInterface, actor, action, targetID string) error {
	timestamp := time.Now().UTC().Format(time.RFC3339)
	txID := ctx.GetStub().GetTxID()

	auditID := fmt.Sprintf("audit_%s_%s", targetID, timestamp)
	auditHash := fmt.Sprintf("hash_%s_%s_%s", actor, action, timestamp)

	audit := AuditDocument{
		DocType:   "audit",
		AuditHash: auditHash,
		Actor:     actor,
		Action:    action,
		TargetID:  targetID,
		Timestamp: timestamp,
		TxID:      txID,
	}

	auditJSON, err := json.Marshal(audit)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(auditID, auditJSON)
}

// ========== DID DOCUMENT CRUD OPERATIONS ==========

// CreateDID creates a new Digital ID document
func (s *SIHChaincode) CreateDID(ctx contractapi.TransactionContextInterface, digitalID, consentHash, expiresAt, issuer string) error {
	existing, err := s.readState(ctx, digitalID)
	if err == nil && existing != nil {
		return fmt.Errorf("the DID document %s already exists", digitalID)
	}

	timestamp := time.Now().UTC().Format(time.RFC3339)
	txID := ctx.GetStub().GetTxID()

	did := DIDDocument{
		DocType:     "did",
		DigitalID:   digitalID,
		ConsentHash: consentHash,
		IssuedAt:    timestamp,
		ExpiresAt:   expiresAt,
		Issuer:      issuer,
		TxID:        txID,
	}

	didJSON, err := json.Marshal(did)
	if err != nil {
		return err
	}

	err = ctx.GetStub().PutState(digitalID, didJSON)
	if err != nil {
		return err
	}

	ctx.GetStub().SetEvent("CreateDID", didJSON)
	s.createAuditLog(ctx, issuer, "CREATE_DID", digitalID)
	return nil
}

// ReadDID returns the DID document with given digital ID
func (s *SIHChaincode) ReadDID(ctx contractapi.TransactionContextInterface, digitalID string) (*DIDDocument, error) {
	didJSON, err := s.readState(ctx, digitalID)
	if err != nil {
		return nil, err
	}

	var did DIDDocument
	err = json.Unmarshal(didJSON, &did)
	if err != nil {
		return nil, err
	}

	return &did, nil
}

// UpdateDID updates an existing DID document
func (s *SIHChaincode) UpdateDID(ctx contractapi.TransactionContextInterface, digitalID, consentHash, expiresAt, updater string) error {
	existingDID, err := s.ReadDID(ctx, digitalID)
	if err != nil {
		return err
	}

	txID := ctx.GetStub().GetTxID()

	did := DIDDocument{
		DocType:     "did",
		DigitalID:   digitalID,
		ConsentHash: consentHash,
		IssuedAt:    existingDID.IssuedAt, // Keep original issued date
		ExpiresAt:   expiresAt,
		Issuer:      existingDID.Issuer, // Keep original issuer
		TxID:        txID,
	}

	didJSON, err := json.Marshal(did)
	if err != nil {
		return err
	}

	err = ctx.GetStub().PutState(digitalID, didJSON)
	if err != nil {
		return err
	}

	ctx.GetStub().SetEvent("UpdateDID", didJSON)
	s.createAuditLog(ctx, updater, "UPDATE_DID", digitalID)
	return nil
}

// DeleteDID deletes a DID document
func (s *SIHChaincode) DeleteDID(ctx contractapi.TransactionContextInterface, digitalID, actor string) error {
	didJSON, err := s.readState(ctx, digitalID)
	if err != nil {
		return err
	}

	err = ctx.GetStub().DelState(digitalID)
	if err != nil {
		return err
	}

	ctx.GetStub().SetEvent("DeleteDID", didJSON)
	s.createAuditLog(ctx, actor, "DELETE_DID", digitalID)
	return nil
}

// ========== INCIDENT DOCUMENT CRUD OPERATIONS ==========

// CreateIncident creates a new incident record
func (s *SIHChaincode) CreateIncident(ctx contractapi.TransactionContextInterface, incidentID, incidentSummaryHash, reporter string) error {
	existing, err := s.readState(ctx, incidentID)
	if err == nil && existing != nil {
		return fmt.Errorf("the incident %s already exists", incidentID)
	}

	timestamp := time.Now().UTC().Format(time.RFC3339)
	txID := ctx.GetStub().GetTxID()

	incident := IncidentDocument{
		DocType:             "incident",
		IncidentID:          incidentID,
		IncidentSummaryHash: incidentSummaryHash,
		CreatedAt:           timestamp,
		Reporter:            reporter,
		TxID:                txID,
	}

	incidentJSON, err := json.Marshal(incident)
	if err != nil {
		return err
	}

	err = ctx.GetStub().PutState(incidentID, incidentJSON)
	if err != nil {
		return err
	}

	ctx.GetStub().SetEvent("CreateIncident", incidentJSON)
	s.createAuditLog(ctx, reporter, "CREATE_INCIDENT", incidentID)
	return nil
}

// ReadIncident returns the incident document with given incident ID
func (s *SIHChaincode) ReadIncident(ctx contractapi.TransactionContextInterface, incidentID string) (*IncidentDocument, error) {
	incidentJSON, err := s.readState(ctx, incidentID)
	if err != nil {
		return nil, err
	}

	var incident IncidentDocument
	err = json.Unmarshal(incidentJSON, &incident)
	if err != nil {
		return nil, err
	}

	return &incident, nil
}

// UpdateIncident updates an existing incident record
func (s *SIHChaincode) UpdateIncident(ctx contractapi.TransactionContextInterface, incidentID, incidentSummaryHash, updater string) error {
	existingIncident, err := s.ReadIncident(ctx, incidentID)
	if err != nil {
		return err
	}

	txID := ctx.GetStub().GetTxID()

	incident := IncidentDocument{
		DocType:             "incident",
		IncidentID:          incidentID,
		IncidentSummaryHash: incidentSummaryHash,
		CreatedAt:           existingIncident.CreatedAt, // Keep original creation date
		Reporter:            existingIncident.Reporter,  // Keep original reporter
		TxID:                txID,
	}

	incidentJSON, err := json.Marshal(incident)
	if err != nil {
		return err
	}

	err = ctx.GetStub().PutState(incidentID, incidentJSON)
	if err != nil {
		return err
	}

	ctx.GetStub().SetEvent("UpdateIncident", incidentJSON)
	s.createAuditLog(ctx, updater, "UPDATE_INCIDENT", incidentID)
	return nil
}

// DeleteIncident deletes an incident record
func (s *SIHChaincode) DeleteIncident(ctx contractapi.TransactionContextInterface, incidentID, actor string) error {
	incidentJSON, err := s.readState(ctx, incidentID)
	if err != nil {
		return err
	}

	err = ctx.GetStub().DelState(incidentID)
	if err != nil {
		return err
	}

	ctx.GetStub().SetEvent("DeleteIncident", incidentJSON)
	s.createAuditLog(ctx, actor, "DELETE_INCIDENT", incidentID)
	return nil
}

// ========== EVIDENCE DOCUMENT CRUD OPERATIONS ==========

// CreateEvidence creates a new evidence record
func (s *SIHChaincode) CreateEvidence(ctx contractapi.TransactionContextInterface, evidenceID, evidenceHash, incidentID, mediaType, uploadedBy string) error {
	existing, err := s.readState(ctx, evidenceID)
	if err == nil && existing != nil {
		return fmt.Errorf("the evidence %s already exists", evidenceID)
	}

	// Verify that the incident exists
	_, err = s.ReadIncident(ctx, incidentID)
	if err != nil {
		return fmt.Errorf("incident %s does not exist: %w", incidentID, err)
	}

	timestamp := time.Now().UTC().Format(time.RFC3339)
	txID := ctx.GetStub().GetTxID()

	evidence := EvidenceDocument{
		DocType:      "evidence",
		EvidenceHash: evidenceHash,
		IncidentID:   incidentID,
		MediaType:    mediaType,
		UploadedBy:   uploadedBy,
		CreatedAt:    timestamp,
		TxID:         txID,
	}

	evidenceJSON, err := json.Marshal(evidence)
	if err != nil {
		return err
	}

	err = ctx.GetStub().PutState(evidenceID, evidenceJSON)
	if err != nil {
		return err
	}

	ctx.GetStub().SetEvent("CreateEvidence", evidenceJSON)
	s.createAuditLog(ctx, uploadedBy, "CREATE_EVIDENCE", evidenceID)
	return nil
}

// ReadEvidence returns the evidence document with given evidence ID
func (s *SIHChaincode) ReadEvidence(ctx contractapi.TransactionContextInterface, evidenceID string) (*EvidenceDocument, error) {
	evidenceJSON, err := s.readState(ctx, evidenceID)
	if err != nil {
		return nil, err
	}

	var evidence EvidenceDocument
	err = json.Unmarshal(evidenceJSON, &evidence)
	if err != nil {
		return nil, err
	}

	return &evidence, nil
}

// UpdateEvidence updates an existing evidence record
func (s *SIHChaincode) UpdateEvidence(ctx contractapi.TransactionContextInterface, evidenceID, evidenceHash, mediaType, updater string) error {
	existingEvidence, err := s.ReadEvidence(ctx, evidenceID)
	if err != nil {
		return err
	}

	txID := ctx.GetStub().GetTxID()

	evidence := EvidenceDocument{
		DocType:      "evidence",
		EvidenceHash: evidenceHash,
		IncidentID:   existingEvidence.IncidentID, // Keep original incident ID
		MediaType:    mediaType,
		UploadedBy:   existingEvidence.UploadedBy, // Keep original uploader
		CreatedAt:    existingEvidence.CreatedAt,  // Keep original creation date
		TxID:         txID,
	}

	evidenceJSON, err := json.Marshal(evidence)
	if err != nil {
		return err
	}

	err = ctx.GetStub().PutState(evidenceID, evidenceJSON)
	if err != nil {
		return err
	}

	ctx.GetStub().SetEvent("UpdateEvidence", evidenceJSON)
	s.createAuditLog(ctx, updater, "UPDATE_EVIDENCE", evidenceID)
	return nil
}

// DeleteEvidence deletes an evidence record
func (s *SIHChaincode) DeleteEvidence(ctx contractapi.TransactionContextInterface, evidenceID, actor string) error {
	evidenceJSON, err := s.readState(ctx, evidenceID)
	if err != nil {
		return err
	}

	err = ctx.GetStub().DelState(evidenceID)
	if err != nil {
		return err
	}

	ctx.GetStub().SetEvent("DeleteEvidence", evidenceJSON)
	s.createAuditLog(ctx, actor, "DELETE_EVIDENCE", evidenceID)
	return nil
}

// ========== AUDIT DOCUMENT READ OPERATIONS ==========

// ReadAudit returns the audit document with given audit ID
func (s *SIHChaincode) ReadAudit(ctx contractapi.TransactionContextInterface, auditID string) (*AuditDocument, error) {
	auditJSON, err := s.readState(ctx, auditID)
	if err != nil {
		return nil, err
	}

	var audit AuditDocument
	err = json.Unmarshal(auditJSON, &audit)
	if err != nil {
		return nil, err
	}

	return &audit, nil
}

// ========== QUERY OPERATIONS ==========

// GetEvidenceByIncident returns all evidence related to a specific incident
func (s *SIHChaincode) GetEvidenceByIncident(ctx contractapi.TransactionContextInterface, incidentID string) ([]*EvidenceDocument, error) {
	queryString := fmt.Sprintf(`{"selector":{"doc_type":"evidence","incident_id":"%s"}}`, incidentID)

	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var evidenceList []*EvidenceDocument
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var evidence EvidenceDocument
		err = json.Unmarshal(queryResponse.Value, &evidence)
		if err != nil {
			return nil, err
		}
		evidenceList = append(evidenceList, &evidence)
	}

	return evidenceList, nil
}

// GetAuditsByTarget returns all audit logs for a specific target ID
func (s *SIHChaincode) GetAuditsByTarget(ctx contractapi.TransactionContextInterface, targetID string) ([]*AuditDocument, error) {
	queryString := fmt.Sprintf(`{"selector":{"doc_type":"audit","target_id":"%s"}}`, targetID)

	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var auditList []*AuditDocument
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var audit AuditDocument
		err = json.Unmarshal(queryResponse.Value, &audit)
		if err != nil {
			return nil, err
		}
		auditList = append(auditList, &audit)
	}

	return auditList, nil
}
