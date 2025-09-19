package main

import (
	"encoding/json"
	"fmt"
	"testing"
	"time"

	"github.com/hyperledger/fabric-chaincode-go/shim"
	"github.com/hyperledger/fabric-contract-api-go/contractapi"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockStub extends the shim.MockStub to include additional functionality
type MockTransactionContext struct {
	contractapi.TransactionContext
	stub *shim.MockStub
}

func (m *MockTransactionContext) GetStub() shim.ChaincodeStubInterface {
	return m.stub
}

func setupMockContext() *MockTransactionContext {
	mockStub := shim.NewMockStub("sih", nil)
	mockStub.MockTransactionStart("txid")
	return &MockTransactionContext{stub: mockStub}
}

func TestIssueDID(t *testing.T) {
	contract := SIHChaincode{}
	ctx := setupMockContext()

	// Test successful DID issuance
	digitalID := "did:sih:123456789"
	consentHash := "a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890"
	issuedAt := time.Now().UTC().Format(time.RFC3339)
	expiresAt := time.Now().AddDate(1, 0, 0).UTC().Format(time.RFC3339)
	issuer := "SIH Authority"

	txID, err := contract.IssueDID(ctx, digitalID, consentHash, issuedAt, expiresAt, issuer)
	assert.NoError(t, err)
	assert.NotEmpty(t, txID)

	// Verify the DID was stored
	key := fmt.Sprintf("DID#%s", digitalID)
	didBytes := ctx.stub.State[key]
	assert.NotNil(t, didBytes)

	var storedDID DIDDocument
	err = json.Unmarshal(didBytes, &storedDID)
	assert.NoError(t, err)
	assert.Equal(t, "DID", storedDID.DocType)
	assert.Equal(t, digitalID, storedDID.DigitalID)
	assert.Equal(t, consentHash, storedDID.ConsentHash)
	assert.Equal(t, issuer, storedDID.Issuer)
}

func TestIssueDID_InvalidInput(t *testing.T) {
	contract := SIHChaincode{}
	ctx := setupMockContext()

	// Test empty digitalID
	_, err := contract.IssueDID(ctx, "", "validhash1234567890123456789012345678901234567890123456789012345678", 
		time.Now().UTC().Format(time.RFC3339), time.Now().AddDate(1, 0, 0).UTC().Format(time.RFC3339), "issuer")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "digitalID cannot be empty")

	// Test invalid hash format
	_, err = contract.IssueDID(ctx, "did:sih:123", "invalidhash", 
		time.Now().UTC().Format(time.RFC3339), time.Now().AddDate(1, 0, 0).UTC().Format(time.RFC3339), "issuer")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "must be a valid SHA-256 hash")

	// Test invalid timestamp format
	_, err = contract.IssueDID(ctx, "did:sih:123", "a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890", 
		"invalid-time", time.Now().AddDate(1, 0, 0).UTC().Format(time.RFC3339), "issuer")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "must be in RFC3339 format")
}

func TestIssueDID_Idempotency(t *testing.T) {
	contract := SIHChaincode{}
	ctx := setupMockContext()

	digitalID := "did:sih:123456789"
	consentHash := "a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890"
	issuedAt := time.Now().UTC().Format(time.RFC3339)
	expiresAt := time.Now().AddDate(1, 0, 0).UTC().Format(time.RFC3339)
	issuer := "SIH Authority"

	// Issue DID first time
	txID1, err := contract.IssueDID(ctx, digitalID, consentHash, issuedAt, expiresAt, issuer)
	assert.NoError(t, err)

	// Issue same DID again (should return existing txID)
	txID2, err := contract.IssueDID(ctx, digitalID, consentHash, issuedAt, expiresAt, issuer)
	assert.NoError(t, err)
	assert.Equal(t, txID1, txID2)
}

func TestVerifyDID(t *testing.T) {
	contract := SIHChaincode{}
	ctx := setupMockContext()

	digitalID := "did:sih:123456789"
	consentHash := "a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890"
	issuedAt := time.Now().UTC().Format(time.RFC3339)
	expiresAt := time.Now().AddDate(1, 0, 0).UTC().Format(time.RFC3339)
	issuer := "SIH Authority"

	// Issue a DID first
	_, err := contract.IssueDID(ctx, digitalID, consentHash, issuedAt, expiresAt, issuer)
	assert.NoError(t, err)

	// Verify the DID
	did, err := contract.VerifyDID(ctx, digitalID)
	assert.NoError(t, err)
	assert.NotNil(t, did)
	assert.Equal(t, "DID", did.DocType)
	assert.Equal(t, digitalID, did.DigitalID)
	assert.Equal(t, consentHash, did.ConsentHash)

	// Test non-existent DID
	_, err = contract.VerifyDID(ctx, "nonexistent")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "not found")
}

func TestVerifyDID_EmptyInput(t *testing.T) {
	contract := SIHChaincode{}
	ctx := setupMockContext()

	_, err := contract.VerifyDID(ctx, "")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "digitalID cannot be empty")
}

func TestRecordIncident(t *testing.T) {
	contract := SIHChaincode{}
	ctx := setupMockContext()

	incidentID := "INC001"
	incidentSummaryHash := "b1c2d3e4f5a6789012345678901234567890123456789012345678901234567890"
	createdAt := time.Now().UTC().Format(time.RFC3339)
	reporter := "reporter@example.com"

	txID, err := contract.RecordIncident(ctx, incidentID, incidentSummaryHash, createdAt, reporter)
	assert.NoError(t, err)
	assert.NotEmpty(t, txID)

	// Verify the incident was stored
	key := fmt.Sprintf("INC#%s", incidentID)
	incidentBytes := ctx.stub.State[key]
	assert.NotNil(t, incidentBytes)

	var storedIncident IncidentDocument
	err = json.Unmarshal(incidentBytes, &storedIncident)
	assert.NoError(t, err)
	assert.Equal(t, "INC", storedIncident.DocType)
	assert.Equal(t, incidentID, storedIncident.IncidentID)
	assert.Equal(t, incidentSummaryHash, storedIncident.IncidentSummaryHash)
	assert.Equal(t, reporter, storedIncident.Reporter)
}

func TestRecordIncident_InvalidInputs(t *testing.T) {
	contract := SIHChaincode{}
	ctx := setupMockContext()

	validHash := "b1c2d3e4f5a6789012345678901234567890123456789012345678901234567890"
	validTime := time.Now().UTC().Format(time.RFC3339)

	// Test empty incidentID
	_, err := contract.RecordIncident(ctx, "", validHash, validTime, "reporter")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "incidentID cannot be empty")

	// Test empty hash
	_, err = contract.RecordIncident(ctx, "INC001", "", validTime, "reporter")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "incidentSummaryHash cannot be empty")

	// Test invalid hash
	_, err = contract.RecordIncident(ctx, "INC001", "invalid", validTime, "reporter")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "must be a valid SHA-256 hash")

	// Test invalid timestamp
	_, err = contract.RecordIncident(ctx, "INC001", validHash, "invalid-time", "reporter")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "must be in RFC3339 format")

	// Test empty reporter
	_, err = contract.RecordIncident(ctx, "INC001", validHash, validTime, "")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "reporter cannot be empty")
}

func TestRecordIncident_Duplicate(t *testing.T) {
	contract := SIHChaincode{}
	ctx := setupMockContext()

	incidentID := "INC001"
	incidentSummaryHash := "b1c2d3e4f5a6789012345678901234567890123456789012345678901234567890"
	createdAt := time.Now().UTC().Format(time.RFC3339)
	reporter := "reporter@example.com"

	// Record incident first time
	_, err := contract.RecordIncident(ctx, incidentID, incidentSummaryHash, createdAt, reporter)
	assert.NoError(t, err)

	// Try to record same incident again (should fail)
	_, err = contract.RecordIncident(ctx, incidentID, incidentSummaryHash, createdAt, reporter)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "already exists")
}

func TestAnchorEvidence(t *testing.T) {
	contract := SIHChaincode{}
	ctx := setupMockContext()

	// First create an incident
	incidentID := "INC001"
	incidentSummaryHash := "b1c2d3e4f5a6789012345678901234567890123456789012345678901234567890"
	createdAt := time.Now().UTC().Format(time.RFC3339)
	reporter := "reporter@example.com"

	_, err := contract.RecordIncident(ctx, incidentID, incidentSummaryHash, createdAt, reporter)
	assert.NoError(t, err)

	// Now anchor evidence
	evidenceHash := "c1d2e3f4a5b6789012345678901234567890123456789012345678901234567890"
	mediaType := "image/jpeg"
	uploadedBy := "witness@example.com"

	txID, err := contract.AnchorEvidence(ctx, evidenceHash, incidentID, mediaType, uploadedBy)
	assert.NoError(t, err)
	assert.NotEmpty(t, txID)

	// Verify the evidence was stored
	key := fmt.Sprintf("EVID#%s", evidenceHash)
	evidenceBytes := ctx.stub.State[key]
	assert.NotNil(t, evidenceBytes)

	var storedEvidence EvidenceDocument
	err = json.Unmarshal(evidenceBytes, &storedEvidence)
	assert.NoError(t, err)
	assert.Equal(t, "EVID", storedEvidence.DocType)
	assert.Equal(t, evidenceHash, storedEvidence.EvidenceHash)
	assert.Equal(t, incidentID, storedEvidence.IncidentID)
	assert.Equal(t, mediaType, storedEvidence.MediaType)
	assert.Equal(t, uploadedBy, storedEvidence.UploadedBy)
	assert.NotEmpty(t, storedEvidence.CreatedAt)
}

func TestAnchorEvidence_InvalidInputs(t *testing.T) {
	contract := SIHChaincode{}
	ctx := setupMockContext()

	// Create incident first
	incidentID := "INC001"
	incidentSummaryHash := "b1c2d3e4f5a6789012345678901234567890123456789012345678901234567890"
	createdAt := time.Now().UTC().Format(time.RFC3339)
	_, err := contract.RecordIncident(ctx, incidentID, incidentSummaryHash, createdAt, "reporter")
	assert.NoError(t, err)

	// Test empty evidence hash
	_, err = contract.AnchorEvidence(ctx, "", incidentID, "image/jpeg", "uploader")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "evidenceHash cannot be empty")

	// Test invalid hash format
	_, err = contract.AnchorEvidence(ctx, "invalid", incidentID, "image/jpeg", "uploader")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "must be a valid SHA-256 hash")

	// Test empty incident ID
	validHash := "c1d2e3f4a5b6789012345678901234567890123456789012345678901234567890"
	_, err = contract.AnchorEvidence(ctx, validHash, "", "image/jpeg", "uploader")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "incidentID cannot be empty")

	// Test empty uploader
	_, err = contract.AnchorEvidence(ctx, validHash, incidentID, "image/jpeg", "")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "uploadedBy cannot be empty")
}

func TestAnchorEvidence_InvalidIncident(t *testing.T) {
	contract := SIHChaincode{}
	ctx := setupMockContext()

	evidenceHash := "c1d2e3f4a5b6789012345678901234567890123456789012345678901234567890"
	incidentID := "NONEXISTENT"
	mediaType := "image/jpeg"
	uploadedBy := "witness@example.com"

	_, err := contract.AnchorEvidence(ctx, evidenceHash, incidentID, mediaType, uploadedBy)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "not found")
}

func TestAnchorEvidence_DuplicateEvidence(t *testing.T) {
	contract := SIHChaincode{}
	ctx := setupMockContext()

	// Create incident
	incidentID := "INC001"
	incidentSummaryHash := "b1c2d3e4f5a6789012345678901234567890123456789012345678901234567890"
	createdAt := time.Now().UTC().Format(time.RFC3339)
	_, err := contract.RecordIncident(ctx, incidentID, incidentSummaryHash, createdAt, "reporter")
	assert.NoError(t, err)

	// Anchor evidence first time
	evidenceHash := "c1d2e3f4a5b6789012345678901234567890123456789012345678901234567890"
	_, err = contract.AnchorEvidence(ctx, evidenceHash, incidentID, "image/jpeg", "uploader")
	assert.NoError(t, err)

	// Try to anchor same evidence again (should fail)
	_, err = contract.AnchorEvidence(ctx, evidenceHash, incidentID, "image/jpeg", "uploader")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "already exists")
}

func TestAppendAudit(t *testing.T) {
	contract := SIHChaincode{}
	ctx := setupMockContext()

	auditHash := "d1e2f3a4b5c6789012345678901234567890123456789012345678901234567890"
	actor := "system"
	action := "CREATE_DID"
	targetID := "did:sih:123456789"

	txID, err := contract.AppendAudit(ctx, auditHash, actor, action, targetID)
	assert.NoError(t, err)
	assert.NotEmpty(t, txID)

	// Verify the audit was stored
	key := fmt.Sprintf("AUDIT#%s", auditHash)
	auditBytes := ctx.stub.State[key]
	assert.NotNil(t, auditBytes)

	var storedAudit AuditDocument
	err = json.Unmarshal(auditBytes, &storedAudit)
	assert.NoError(t, err)
	assert.Equal(t, "AUDIT", storedAudit.DocType)
	assert.Equal(t, auditHash, storedAudit.AuditHash)
	assert.Equal(t, actor, storedAudit.Actor)
	assert.Equal(t, action, storedAudit.Action)
	assert.Equal(t, targetID, storedAudit.TargetID)
	assert.NotEmpty(t, storedAudit.Timestamp)
}

func TestAppendAudit_InvalidInputs(t *testing.T) {
	contract := SIHChaincode{}
	ctx := setupMockContext()

	validHash := "d1e2f3a4b5c6789012345678901234567890123456789012345678901234567890"

	// Test empty actor
	_, err := contract.AppendAudit(ctx, validHash, "", "action", "target")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "actor cannot be empty")

	// Test empty action
	_, err = contract.AppendAudit(ctx, validHash, "actor", "", "target")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "action cannot be empty")

	// Test empty target
	_, err = contract.AppendAudit(ctx, validHash, "actor", "action", "")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "targetID cannot be empty")

	// Test invalid hash format
	_, err = contract.AppendAudit(ctx, "invalid", "actor", "action", "target")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "must be a valid SHA-256 hash")
}

func TestAppendAudit_GenerateHash(t *testing.T) {
	contract := SIHChaincode{}
	ctx := setupMockContext()

	// Test with empty audit hash (should generate one)
	actor := "system"
	action := "CREATE_DID"
	targetID := "did:sih:123456789"

	txID, err := contract.AppendAudit(ctx, "", actor, action, targetID)
	assert.NoError(t, err)
	assert.NotEmpty(t, txID)

	// Should have generated a hash and stored the audit
	foundAudit := false
	for key, value := range ctx.stub.State {
		if len(key) > 6 && key[:6] == "AUDIT#" {
			var storedAudit AuditDocument
			err = json.Unmarshal(value, &storedAudit)
			assert.NoError(t, err)
			if storedAudit.Actor == actor && storedAudit.Action == action && storedAudit.TargetID == targetID {
				foundAudit = true
				assert.NotEmpty(t, storedAudit.AuditHash)
				assert.Len(t, storedAudit.AuditHash, 64) // SHA-256 hash length
				break
			}
		}
	}
	assert.True(t, foundAudit, "Generated audit entry should be found in state")
}

func TestAppendAudit_DuplicateHash(t *testing.T) {
	contract := SIHChaincode{}
	ctx := setupMockContext()

	auditHash := "d1e2f3a4b5c6789012345678901234567890123456789012345678901234567890"
	
	// Create first audit entry
	_, err := contract.AppendAudit(ctx, auditHash, "actor1", "action1", "target1")
	assert.NoError(t, err)

	// Try to create duplicate (should fail)
	_, err = contract.AppendAudit(ctx, auditHash, "actor2", "action2", "target2")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "already exists")
}

func TestQueryIncidentsByTimeRange(t *testing.T) {
	contract := SIHChaincode{}
	ctx := setupMockContext()

	// Create test incidents with different timestamps
	incidents := []struct {
		id        string
		hash      string
		timestamp string
		reporter  string
	}{
		{"INC001", "hash001", "2024-01-15T10:00:00Z", "reporter1@example.com"},
		{"INC002", "hash002", "2024-02-15T10:00:00Z", "reporter2@example.com"},
		{"INC003", "hash003", "2024-03-15T10:00:00Z", "reporter3@example.com"},
	}

	for _, inc := range incidents {
		// Convert hash to proper format (pad to 64 chars)
		hash := fmt.Sprintf("%064s", inc.hash)
		_, err := contract.RecordIncident(ctx, inc.id, hash, inc.timestamp, inc.reporter)
		assert.NoError(t, err)
	}

	// Query incidents in time range
	results, err := contract.QueryIncidentsByTimeRange(ctx, "2024-01-01T00:00:00Z", "2024-02-28T23:59:59Z")
	assert.NoError(t, err)
	assert.Len(t, results, 2) // Should find INC001 and INC002

	// Verify the results
	foundIds := make(map[string]bool)
	for _, result := range results {
		foundIds[result.IncidentID] = true
	}
	assert.True(t, foundIds["INC001"])
	assert.True(t, foundIds["INC002"])
	assert.False(t, foundIds["INC003"])
}

func TestQueryIncidentsByTimeRange_InvalidInputs(t *testing.T) {
	contract := SIHChaincode{}
	ctx := setupMockContext()

	// Test invalid start time
	_, err := contract.QueryIncidentsByTimeRange(ctx, "invalid-time", "2024-12-31T23:59:59Z")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "must be in RFC3339 format")

	// Test invalid end time
	_, err = contract.QueryIncidentsByTimeRange(ctx, "2024-01-01T00:00:00Z", "invalid-time")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "must be in RFC3339 format")
}

func TestQueryEvidenceByIncident(t *testing.T) {
	contract := SIHChaincode{}
	ctx := setupMockContext()

	// Create incident
	incidentID := "INC001"
	incidentHash := fmt.Sprintf("%064s", "incident001")
	_, err := contract.RecordIncident(ctx, incidentID, incidentHash, "2024-01-01T10:00:00Z", "reporter")
	assert.NoError(t, err)

	// Create evidence
	evidence := []struct {
		hash      string
		mediaType string
		uploader  string
	}{
		{"evidence001", "image/jpeg", "user1@example.com"},
		{"evidence002", "video/mp4", "user2@example.com"},
		{"evidence003", "audio/wav", "user3@example.com"},
	}

	for _, ev := range evidence {
		hash := fmt.Sprintf("%064s", ev.hash)
		_, err := contract.AnchorEvidence(ctx, hash, incidentID, ev.mediaType, ev.uploader)
		assert.NoError(t, err)
	}

	// Query evidence for incident
	results, err := contract.QueryEvidenceByIncident(ctx, incidentID)
	assert.NoError(t, err)
	assert.Len(t, results, 3)

	// Verify results
	mediaTypes := make(map[string]bool)
	for _, result := range results {
		assert.Equal(t, incidentID, result.IncidentID)
		mediaTypes[result.MediaType] = true
	}
	assert.True(t, mediaTypes["image/jpeg"])
	assert.True(t, mediaTypes["video/mp4"])
	assert.True(t, mediaTypes["audio/wav"])
}

func TestQueryEvidenceByIncident_InvalidInput(t *testing.T) {
	contract := SIHChaincode{}
	ctx := setupMockContext()

	_, err := contract.QueryEvidenceByIncident(ctx, "")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "incidentID cannot be empty")
}

func TestGetAllDocuments(t *testing.T) {
	contract := SIHChaincode{}
	ctx := setupMockContext()

	// Create test data
	digitalID := "did:sih:test123"
	consentHash := fmt.Sprintf("%064s", "consent123")
	_, err := contract.IssueDID(ctx, digitalID, consentHash, "2024-01-01T00:00:00Z", "2025-01-01T00:00:00Z", "issuer")
	assert.NoError(t, err)

	incidentHash := fmt.Sprintf("%064s", "incident123")
	_, err = contract.RecordIncident(ctx, "INC001", incidentHash, "2024-01-01T10:00:00Z", "reporter")
	assert.NoError(t, err)

	// Query all DIDs
	didResults, err := contract.GetAllDocuments(ctx, "DID")
	assert.NoError(t, err)
	assert.Len(t, didResults, 1)
	assert.Contains(t, didResults[0].Key, "DID#")

	// Query all incidents
	incResults, err := contract.GetAllDocuments(ctx, "INC")
	assert.NoError(t, err)
	assert.Len(t, incResults, 1)
	assert.Contains(t, incResults[0].Key, "INC#")
}

// Integration tests
func TestFullWorkflow(t *testing.T) {
	contract := SIHChaincode{}
	ctx := setupMockContext()

	// Step 1: Issue a DID
	digitalID := "did:sih:workflow123"
	consentHash := "a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890"
	didTxID, err := contract.IssueDID(ctx, digitalID, consentHash, "2024-01-01T00:00:00Z", "2025-01-01T00:00:00Z", "SIH Authority")
	assert.NoError(t, err)
	assert.NotEmpty(t, didTxID)

	// Step 2: Verify DID
	did, err := contract.VerifyDID(ctx, digitalID)
	assert.NoError(t, err)
	assert.Equal(t, digitalID, did.DigitalID)

	// Step 3: Record incident
	incidentID := "WORKFLOW_INC001"
	incidentHash := "b1c2d3e4f5a6789012345678901234567890123456789012345678901234567890"
	incTxID, err := contract.RecordIncident(ctx, incidentID, incidentHash, "2024-01-15T14:30:00Z", "workflow@example.com")
	assert.NoError(t, err)
	assert.NotEmpty(t, incTxID)

	// Step 4: Anchor evidence
	evidenceHash := "c1d2e3f4a5b6789012345678901234567890123456789012345678901234567890"
	evTxID, err := contract.AnchorEvidence(ctx, evidenceHash, incidentID, "image/jpeg", "witness@example.com")
	assert.NoError(t, err)
	assert.NotEmpty(t, evTxID)

	// Step 5: Create audit log
	auditTxID, err := contract.AppendAudit(ctx, "", "system", "WORKFLOW_TEST", incidentID)
	assert.NoError(t, err)
	assert.NotEmpty(t, auditTxID)

	// Step 6: Query evidence for incident
	evidence, err := contract.QueryEvidenceByIncident(ctx, incidentID)
	assert.NoError(t, err)
	assert.Len(t, evidence, 1)
	assert.Equal(t, evidenceHash, evidence[0].EvidenceHash)

	// Step 7: Query incidents by time
	incidents, err := contract.QueryIncidentsByTimeRange(ctx, "2024-01-01T00:00:00Z", "2024-12-31T23:59:59Z")
	assert.NoError(t, err)
	assert.GreaterOrEqual(t, len(incidents), 1)

	// Verify all transaction IDs are different
	txIDs := []string{didTxID, incTxID, evTxID, auditTxID}
	for i, id1 := range txIDs {
		for j, id2 := range txIDs {
			if i != j {
				assert.NotEqual(t, id1, id2, "Transaction IDs should be unique")
			}
		}
	}
}

// Benchmarks
func BenchmarkIssueDID(b *testing.B) {
	contract := SIHChaincode{}
	
	for i := 0; i < b.N; i++ {
		ctx := setupMockContext()
		digitalID := fmt.Sprintf("did:sih:%d", i)
		consentHash := "a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890"
		issuedAt := time.Now().UTC().Format(time.RFC3339)
		expiresAt := time.Now().AddDate(1, 0, 0).UTC().Format(time.RFC3339)
		issuer := "SIH Authority"

		_, err := contract.IssueDID(ctx, digitalID, consentHash, issuedAt, expiresAt, issuer)
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkRecordIncident(b *testing.B) {
	contract := SIHChaincode{}
	
	for i := 0; i < b.N; i++ {
		ctx := setupMockContext()
		incidentID := fmt.Sprintf("INC%d", i)
		incidentSummaryHash := "b1c2d3e4f5a6789012345678901234567890123456789012345678901234567890"
		createdAt := time.Now().UTC().Format(time.RFC3339)
		reporter := "reporter@example.com"

		_, err := contract.RecordIncident(ctx, incidentID, incidentSummaryHash, createdAt, reporter)
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkAnchorEvidence(b *testing.B) {
	contract := SIHChaincode{}
	ctx := setupMockContext()
	
	// Create base incident for all evidence
	incidentHash := "b1c2d3e4f5a6789012345678901234567890123456789012345678901234567890"
	_, err := contract.RecordIncident(ctx, "BENCH_INC", incidentHash, time.Now().UTC().Format(time.RFC3339), "reporter")
	if err != nil {
		b.Fatal(err)
	}
	
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		// Generate unique evidence hash for each iteration
		evidenceHash := fmt.Sprintf("%063d%d", i, i%10)
		_, err := contract.AnchorEvidence(ctx, evidenceHash, "BENCH_INC", "image/jpeg", "uploader@example.com")
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkVerifyDID(b *testing.B) {
	contract := SIHChaincode{}
	ctx := setupMockContext()
	
	// Create DIDs for verification
	numDIDs := 100
	for i := 0; i < numDIDs; i++ {
		digitalID := fmt.Sprintf("did:sih:bench%d", i)
		consentHash := fmt.Sprintf("%063d%d", i, i%10)
		_, err := contract.IssueDID(ctx, digitalID, consentHash, time.Now().UTC().Format(time.RFC3339), 
			time.Now().AddDate(1, 0, 0).UTC().Format(time.RFC3339), "Bench Authority")
		if err != nil {
			b.Fatal(err)
		}
	}
	
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		digitalID := fmt.Sprintf("did:sih:bench%d", i%numDIDs)
		_, err := contract.VerifyDID(ctx, digitalID)
		if err != nil {
			b.Fatal(err)
		}
	}
}

// Edge case tests
func TestEdgeCases(t *testing.T) {
	contract := SIHChaincode{}
	ctx := setupMockContext()

	t.Run("Very long digital ID", func(t *testing.T) {
		longID := "did:sih:" + strings.Repeat("a", 200)
		hash := "a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890"
		_, err := contract.IssueDID(ctx, longID, hash, "2024-01-01T00:00:00Z", "2025-01-01T00:00:00Z", "issuer")
		assert.NoError(t, err) // Should handle long IDs
	})

	t.Run("Unicode characters in fields", func(t *testing.T) {
		digitalID := "did:sih:测试123"
		hash := "a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890"
		_, err := contract.IssueDID(ctx, digitalID, hash, "2024-01-01T00:00:00Z", "2025-01-01T00:00:00Z", "测试机构")
		assert.NoError(t, err) // Should handle Unicode
	})

	t.Run("Minimum valid timestamp", func(t *testing.T) {
		digitalID := "did:sih:mintime"
		hash := "a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890"
		_, err := contract.IssueDID(ctx, digitalID, hash, "1970-01-01T00:00:00Z", "2025-01-01T00:00:00Z", "issuer")
		assert.NoError(t, err) // Should handle Unix epoch
	})

	t.Run("Hash with mixed case", func(t *testing.T) {
		digitalID := "did:sih:mixedcase"
		hash := "A1B2c3d4E5F6789012345678901234567890123456789012345678901234567890"
		_, err := contract.IssueDID(ctx, digitalID, hash, "2024-01-01T00:00:00Z", "2025-01-01T00:00:00Z", "issuer")
		assert.Error(t, err) // Should reject mixed case (strict lowercase required)
	})

	t.Run("Hash with exactly 64 characters", func(t *testing.T) {
		digitalID := "did:sih:exact64"
		hash := "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
		_, err := contract.IssueDID(ctx, digitalID, hash, "2024-01-01T00:00:00Z", "2025-01-01T00:00:00Z", "issuer")
		assert.NoError(t, err) // Should accept exactly 64 hex chars
	})

	t.Run("Hash with 63 characters", func(t *testing.T) {
		digitalID := "did:sih:short63"
		hash := "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcde"
		_, err := contract.IssueDID(ctx, digitalID, hash, "2024-01-01T00:00:00Z", "2025-01-01T00:00:00Z", "issuer")
		assert.Error(t, err) // Should reject 63 chars
	})

	t.Run("Hash with 65 characters", func(t *testing.T) {
		digitalID := "did:sih:long65"
		hash := "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef0"
		_, err := contract.IssueDID(ctx, digitalID, hash, "2024-01-01T00:00:00Z", "2025-01-01T00:00:00Z", "issuer")
		assert.Error(t, err) // Should reject 65 chars
	})
}

// Concurrency tests (simulating multiple transactions)
func TestConcurrency(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping concurrency tests in short mode")
	}

	contract := SIHChaincode{}
	
	t.Run("Concurrent DID issuance", func(t *testing.T) {
		const numGoroutines = 10
		var wg sync.WaitGroup
		errors := make(chan error, numGoroutines)
		
		for i := 0; i < numGoroutines; i++ {
			wg.Add(1)
			go func(id int) {
				defer wg.Done()
				ctx := setupMockContext()
				digitalID := fmt.Sprintf("did:sih:concurrent%d", id)
				hash := fmt.Sprintf("%063d%d", id, id%10)
				_, err := contract.IssueDID(ctx, digitalID, hash, "2024-01-01T00:00:00Z", "2025-01-01T00:00:00Z", "concurrent-issuer")
				if err != nil {
					errors <- err
				}
			}(i)
		}
		
		wg.Wait()
		close(errors)
		
		for err := range errors {
			t.Errorf("Concurrent DID issuance failed: %v", err)
		}
	})
}

// Performance characteristics tests
func TestPerformanceCharacteristics(t *testing.T) {
	contract := SIHChaincode{}
	ctx := setupMockContext()

	// Test performance with increasing data sizes
	sizes := []int{10, 50, 100}
	
	for _, size := range sizes {
		t.Run(fmt.Sprintf("QueryPerformance_%d_incidents", size), func(t *testing.T) {
			// Create incidents
			for i := 0; i < size; i++ {
				incidentID := fmt.Sprintf("PERF_INC_%d_%d", size, i)
				hash := fmt.Sprintf("%063d%d", i, i%10)
				timestamp := time.Now().Add(time.Duration(i) * time.Minute).UTC().Format(time.RFC3339)
				_, err := contract.RecordIncident(ctx, incidentID, hash, timestamp, fmt.Sprintf("reporter%d@example.com", i))
				assert.NoError(t, err)
			}
			
			// Measure query performance
			start := time.Now()
			results, err := contract.QueryIncidentsByTimeRange(ctx, "2024-01-01T00:00:00Z", "2025-01-01T00:00:00Z")
			duration := time.Since(start)
			
			assert.NoError(t, err)
			assert.GreaterOrEqual(t, len(results), size)
			t.Logf("Query with %d incidents took %v", size, duration)
			
			// Performance should be reasonable (under 100ms for test data)
			assert.Less(t, duration, 100*time.Millisecond, "Query performance degraded")
		})
	}
}

// Data integrity tests
func TestDataIntegrity(t *testing.T) {
	contract := SIHChaincode{}
	ctx := setupMockContext()

	t.Run("Document structure integrity", func(t *testing.T) {
		// Create a DID
		digitalID := "did:sih:integrity"
		consentHash := "a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890"
		originalTime := "2024-01-01T12:00:00Z"
		
		txID, err := contract.IssueDID(ctx, digitalID, consentHash, originalTime, "2025-01-01T12:00:00Z", "integrity-issuer")
		assert.NoError(t, err)
		
		// Retrieve and verify all fields are preserved
		did, err := contract.VerifyDID(ctx, digitalID)
		assert.NoError(t, err)
		assert.Equal(t, "DID", did.DocType)
		assert.Equal(t, digitalID, did.DigitalID)
		assert.Equal(t, consentHash, did.ConsentHash)
		assert.Equal(t, originalTime, did.IssuedAt)
		assert.Equal(t, "2025-01-01T12:00:00Z", did.ExpiresAt)
		assert.Equal(t, "integrity-issuer", did.Issuer)
		assert.Equal(t, txID, did.TxID)
	})

	t.Run("Timestamp precision preservation", func(t *testing.T) {
		// Test with high precision timestamp
		preciseTimes := []string{
			"2024-01-01T12:00:00.123Z",
			"2024-01-01T12:00:00.123456Z",
			"2024-01-01T12:00:00.123456789Z",
		}
		
		for i, preciseTime := range preciseTimes {
			incidentID := fmt.Sprintf("PRECISE_INC_%d", i)
			hash := fmt.Sprintf("%063d%d", i, i%10)
			_, err := contract.RecordIncident(ctx, incidentID, hash, preciseTime, "precision@example.com")
			assert.NoError(t, err, "Should handle precise timestamp: %s", preciseTime)
		}
	})
}

// Helper function to verify all required imports
func TestImports(t *testing.T) {
	// This test ensures all imports are properly used
	t.Run("All imports utilized", func(t *testing.T) {
		// json package
		data := map[string]interface{}{"test": "value"}
		_, err := json.Marshal(data)
		assert.NoError(t, err)
		
		// fmt package
		formatted := fmt.Sprintf("test %d", 123)
		assert.Equal(t, "test 123", formatted)
		
		// time package
		now := time.Now()
		assert.NotZero(t, now)
		
		// strings package (if used)
		result := strings.Repeat("a", 5)
		assert.Equal(t, "aaaaa", result)
	})
}package main

import (
	"encoding/json"
	"fmt"
	"testing"
	"time"

	"github.com/hyperledger/fabric-chaincode-go/shim"
	"github.com/hyperledger/fabric-contract-api-go/contractapi"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockStub extends the shim.MockStub to include additional functionality
type MockTransactionContext struct {
	contractapi.TransactionContext
	stub *shim.MockStub
}

func (m *MockTransactionContext) GetStub() shim.ChaincodeStubInterface {
	return m.stub
}

func setupMockContext() *MockTransactionContext {
	mockStub := shim.NewMockStub("sih", nil)
	mockStub.MockTransactionStart("txid")
	return &MockTransactionContext{stub: mockStub}
}

func TestIssueDID(t *testing.T) {
	contract := SIHChaincode{}
	ctx := setupMockContext()

	// Test successful DID issuance
	digitalID := "did:sih:123456789"
	consentHash := "a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890"
	issuedAt := time.Now().UTC().Format(time.RFC3339)
	expiresAt := time.Now().AddDate(1, 0, 0).UTC().Format(time.RFC3339)
	issuer := "SIH Authority"

	txID, err := contract.IssueDID(ctx, digitalID, consentHash, issuedAt, expiresAt, issuer)
	assert.NoError(t, err)
	assert.NotEmpty(t, txID)

	// Verify the DID was stored
	key := fmt.Sprintf("DID#%s", digitalID)
	didBytes := ctx.stub.State[key]
	assert.NotNil(t, didBytes)

	var storedDID DIDDocument
	err = json.Unmarshal(didBytes, &storedDID)
	assert.NoError(t, err)
	assert.Equal(t, "DID", storedDID.DocType)
	assert.Equal(t, digitalID, storedDID.DigitalID)
	assert.Equal(t, consentHash, storedDID.ConsentHash)
	assert.Equal(t, issuer, storedDID.Issuer)
}

func TestIssueDID_InvalidInput(t *testing.T) {
	contract := SIHChaincode{}
	ctx := setupMockContext()

	// Test empty digitalID
	_, err := contract.IssueDID(ctx, "", "validhash1234567890123456789012345678901234567890123456789012345678", 
		time.Now().UTC().Format(time.RFC3339), time.Now().AddDate(1, 0, 0).UTC().Format(time.RFC3339), "issuer")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "digitalID cannot be empty")

	// Test invalid hash format
	_, err = contract.IssueDID(ctx, "did:sih:123", "invalidhash", 
		time.Now().UTC().Format(time.RFC3339), time.Now().AddDate(1, 0, 0).UTC().Format(time.RFC3339), "issuer")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "must be a valid SHA-256 hash")

	// Test invalid timestamp format
	_, err = contract.IssueDID(ctx, "did:sih:123", "a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890", 
		"invalid-time", time.Now().AddDate(1, 0, 0).UTC().Format(time.RFC3339), "issuer")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "must be in RFC3339 format")
}

func TestIssueDID_Idempotency(t *testing.T) {
	contract := SIHChaincode{}
	ctx := setupMockContext()

	digitalID := "did:sih:123456789"
	consentHash := "a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890"
	issuedAt := time.Now().UTC().Format(time.RFC3339)
	expiresAt := time.Now().AddDate(1, 0, 0).UTC().Format(time.RFC3339)
	issuer := "SIH Authority"

	// Issue DID first time
	txID1, err := contract.IssueDID(ctx, digitalID, consentHash, issuedAt, expiresAt, issuer)
	assert.NoError(t, err)

	// Issue same DID again (should return existing txID)
	txID2, err := contract.IssueDID(ctx, digitalID, consentHash, issuedAt, expiresAt, issuer)
	assert.NoError(t, err)
	assert.Equal(t, txID1, txID2)
}

func TestVerifyDID(t *testing.T) {
	contract := SIHChaincode{}
	ctx := setupMockContext()

	digitalID := "did:sih:123456789"
	consentHash := "a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890"
	issuedAt := time.Now().UTC().Format(time.RFC3339)
	expiresAt := time.Now().AddDate(1, 0, 0).UTC().Format(time.RFC3339)
	issuer := "SIH Authority"

	// Issue a DID first
	_, err := contract.IssueDID(ctx, digitalID, consentHash, issuedAt, expiresAt, issuer)
	assert.NoError(t, err)

	// Verify the DID
	did, err := contract.VerifyDID(ctx, digitalID)
	assert.NoError(t, err)
	assert.NotNil(t, did)
	assert.Equal(t, "DID", did.DocType)
	assert.Equal(t, digitalID, did.DigitalID)
	assert.Equal(t, consentHash, did.ConsentHash)

	// Test non-existent DID
	_, err = contract.VerifyDID(ctx, "nonexistent")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "not found")
}

func TestRecordIncident(t *testing.T) {
	contract := SIHChaincode{}
	ctx := setupMockContext()

	incidentID := "INC001"
	incidentSummaryHash := "b1c2d3e4f5a6789012345678901234567890123456789012345678901234567890"
	createdAt := time.Now().UTC().Format(time.RFC3339)
	reporter := "reporter@example.com"

	txID, err := contract.RecordIncident(ctx, incidentID, incidentSummaryHash, createdAt, reporter)
	assert.NoError(t, err)
	assert.NotEmpty(t, txID)

	// Verify the incident was stored
	key := fmt.Sprintf("INC#%s", incidentID)
	incidentBytes := ctx.stub.State[key]
	assert.NotNil(t, incidentBytes)

	var storedIncident IncidentDocument
	err = json.Unmarshal(incidentBytes, &storedIncident)
	assert.NoError(t, err)
	assert.Equal(t, "INC", storedIncident.DocType)
	assert.Equal(t, incidentID, storedIncident.IncidentID)
	assert.Equal(t, incidentSummaryHash, storedIncident.IncidentSummaryHash)
	assert.Equal(t, reporter, storedIncident.Reporter)
}

func TestRecordIncident_Duplicate(t *testing.T) {
	contract := SIHChaincode{}
	ctx := setupMockContext()

	incidentID := "INC001"
	incidentSummaryHash := "b1c2d3e4f5a6789012345678901234567890123456789012345678901234567890"
	createdAt := time.Now().UTC().Format(time.RFC3339)
	reporter := "reporter@example.com"

	// Record incident first time
	_, err := contract.RecordIncident(ctx, incidentID, incidentSummaryHash, createdAt, reporter)
	assert.NoError(t, err)

	// Try to record same incident again (should fail)
	_, err = contract.RecordIncident(ctx, incidentID, incidentSummaryHash, createdAt, reporter)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "already exists")
}

func TestAnchorEvidence(t *testing.T) {
	contract := SIHChaincode{}
	ctx := setupMockContext()

	// Create an incident to link evidence to
	incidentID := "INC001"
	incidentHash := "b1c2d3e4f5a6789012345678901234567890123456789012345678901234567890"
	_, err := contract.RecordIncident(ctx, incidentID, incidentHash, time.Now().UTC().Format(time.RFC3339), "reporter@example.com")
	assert.NoError(t, err)

	evidenceHash := "c1d2e3f4a5b6789012345678901234567890123456789012345678901234567890"
	mediaType := "image/jpeg"
	uploader := "uploader@example.com"

	txID, err := contract.AnchorEvidence(ctx, incidentID, evidenceHash, mediaType, uploader)
	assert.NoError(t, err)
	assert.NotEmpty(t, txID)

	// Verify the evidence was stored
	key := fmt.Sprintf("EVIDENCE#%s", evidenceHash)
	evidenceBytes := ctx.stub.State[key]
	assert.NotNil(t, evidenceBytes)

	var storedEvidence EvidenceDocument
	err = json.Unmarshal(evidenceBytes, &storedEvidence)
	assert.NoError(t, err)
	assert.Equal(t, "EVIDENCE", storedEvidence.DocType)
	assert.Equal(t, evidenceHash, storedEvidence.EvidenceHash)
	assert.Equal(t, mediaType, storedEvidence.MediaType)
	assert.Equal(t, uploader, storedEvidence.Uploader)
}
func TestAnchorEvidence_InvalidInput(t *testing.T) {
	contract := SIHChaincode{}
	ctx := setupMockContext()

	// Test empty incidentID
	_, err := contract.AnchorEvidence(ctx, "", "validhash1234567890123456789012345678901234567890123456789012345678", "image/jpeg", "uploader")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "incidentID cannot be empty")

	// Test invalid hash format
	_, err = contract.AnchorEvidence(ctx, "INC001", "invalidhash", "image/jpeg", "uploader")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "must be a valid SHA-256 hash")

	// Test empty media type
	_, err = contract.AnchorEvidence(ctx, "INC001", "a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890", "", "uploader")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "mediaType cannot be empty")

	// Test empty uploader
	_, err = contract.AnchorEvidence(ctx, "INC001", "a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890", "image/jpeg", "")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "uploader cannot be empty")
}

func TestAppendAudit(t *testing.T) {
	contract := SIHChaincode{}
	ctx := setupMockContext()

	auditHash := "d1e2f3a4b5c6789012345678901234567890123456789012345678901234567890"
	actor := "system"
	action := "CREATE_DID"
	targetID := "did:sih:123456789"

	txID, err := contract.AppendAudit(ctx, auditHash, actor, action, targetID)
	assert.NoError(t, err)
	assert.NotEmpty(t, txID)

	// Verify the audit was stored
	key := fmt.Sprintf("AUDIT#%s", auditHash)
	auditBytes := ctx.stub.State[key]
	assert.NotNil(t, auditBytes)

	var storedAudit AuditDocument
	err = json.Unmarshal(auditBytes, &storedAudit)
	assert.NoError(t, err)
	assert.Equal(t, "AUDIT", storedAudit.DocType)
	assert.Equal(t, auditHash, storedAudit.AuditHash)
	assert.Equal(t, actor, storedAudit.Actor)
	assert.Equal(t, action, storedAudit.Action)
	assert.Equal(t, targetID, storedAudit.TargetID)

	// Verify audit entry exists in the list of all audits
	queryKey := "AUDIT#"
	resultsIterator, err := ctx.stub.GetStateByPartialCompositeKey(queryKey, []string{})
	assert.NoError(t, err)
	defer resultsIterator.Close()

	foundAudit := false
	for resultsIterator.HasNext() {
		response, err := resultsIterator.Next()
		assert.NoError(t, err)

		var audits []AuditDocument
		err = json.Unmarshal(response.Value, &audits)
		assert.NoError(t, err)

		for _, storedAudit := range audits {
			if storedAudit.AuditHash == auditHash {
				// Verify fields match
				assert.Equal(t, actor, storedAudit.Actor)
				assert.Equal(t, action, storedAudit.Action)
				assert.Equal(t, targetID, storedAudit.TargetID)
				foundAudit = true
			}
		}
	}
	assert.True(t, foundAudit, "Audit entry not found in query results")
}

func TestAppendAudit_Duplicate(t *testing.T) {
	contract := SIHChaincode{}
	ctx := setupMockContext()

	auditHash := "d1e2f3a4b5c6789012345678901234567890123456789012345678901234567890"

	// Append audit first time
	_, err := contract.AppendAudit(ctx, auditHash, "actor1", "action1", "target1")
	assert.NoError(t, err)

	// Try to append same audit again (should fail)
	_, err = contract.AppendAudit(ctx, auditHash, "actor1", "action1", "target1")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "already exists")
}

func TestQueryIncidentsByTimeRange(t *testing.T) {
	contract := SIHChaincode{}
	ctx := setupMockContext()

	// Create test incidents
	incidents := []struct {
		id        string
		hash      string
		timestamp string
		reporter  string
	}{
		{"INC001", "hash001", "2024-01-15T10:00:00Z", "reporter1"},
		{"INC002", "hash002", "2024-06-20T15:30:00Z", "reporter2"},
		{"INC003", "hash003", "2025-01-10T09:00:00Z", "reporter3"},
	}

	for _, inc := range incidents {
		hash := fmt.Sprintf("%064s", inc.hash)
		_, err := contract.RecordIncident(ctx, inc.id, hash, inc.timestamp, inc.reporter)
		assert.NoError(t, err)
	}

	// Query incidents within 2024
	results, err := contract.QueryIncidentsByTimeRange(ctx, "2024-01-01T00:00:00Z", "2024-12-31T23:59:59Z")
	assert.NoError(t, err)
	assert.Len(t, results, 2)

	// Verify results
	foundIds := make(map[string]bool)
	for _, result := range results {
		foundIds[result.IncidentID] = true
	}
	assert.True(t, foundIds["INC001"])
	assert.True(t, foundIds["INC002"])
	assert.False(t, foundIds["INC003"])

	// Query incidents within a narrower range
	results, err = contract.QueryIncidentsByTimeRange(ctx, "2024-06-01T00:00:00Z", "2024-06-30T23:59:59Z")
	assert.NoError(t, err)
	assert.Len(t, results, 1)
	assert.Equal(t, "INC002", results[0].IncidentID)
}

func TestQueryIncidentsByTimeRange_InvalidInput(t *testing.T) {
	contract := SIHChaincode{}
	ctx := setupMockContext()

	// Test empty start time
	_, err := contract.QueryIncidentsByTimeRange(ctx, "", "2024-12-31T23:59:59Z")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "startTime cannot be empty")

	// Test empty end time
	_, err = contract.QueryIncidentsByTimeRange(ctx, "2024-01-01T00:00:00Z", "")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "endTime cannot be empty")

	// Test invalid time format
	_, err = contract.QueryIncidentsByTimeRange(ctx, "invalid-time", "2024-12-31T23:59:59Z")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "must be in RFC3339 format")
}

func TestQueryEvidenceByIncident(t *testing.T) {
	contract := SIHChaincode{}
	ctx := setupMockContext()

	// Create an incident to link evidence to
	incidentID := "INC001"
	incidentHash := "b1c2d3e4f5a6789012345678901234567890123456789012345678901234567890"
	_, err := contract.RecordIncident(ctx, incidentID, incidentHash, time.Now().UTC().Format(time.RFC3339), "reporter1")
	assert.NoError(t, err)

	// Anchor multiple pieces of evidence
	evidences := []struct {
		hash      string
		mediaType string
		uploader  string
	}{
		{"evidencehash001", "image/jpeg", "uploader1"},
		{"evidencehash002", "video/mp4", "uploader2"},
	}

	for _, ev := range evidences {
		hash := fmt.Sprintf("%064s", ev.hash)
		_, err := contract.AnchorEvidence(ctx, incidentID, hash, ev.mediaType, ev.uploader)
		assert.NoError(t, err)
	}

	// Query evidence by incident ID
	results, err := contract.QueryEvidenceByIncident(ctx, incidentID)
	assert.NoError(t, err)
	assert.Len(t, results, 2)

	// Verify results
	foundHashes := make(map[string]bool)
	for _, result := range results {
		foundHashes[result.EvidenceHash] = true
	}
	assert.True(t, foundHashes[fmt.Sprintf("%064s", "evidencehash001")])
	assert.True(t, foundHashes[fmt.Sprintf("%064s", "evidencehash002")])
}

func TestQueryEvidenceByIncident_NoEvidence(t *testing.T) {
	contract := SIHChaincode{}
	ctx := setupMockContext()

	// Query evidence for non-existent incident
	results, err := contract.QueryEvidenceByIncident(ctx, "NONEXISTENT_INC")
	assert.NoError(t, err)
	assert.Len(t, results, 0)
	
	// Create an incident with no evidence
	incidentID := "INC002"
	incidentHash := "b1c2d3e4f5a6789012345678901234567890123456789012345678901234567890"
	_, err = contract.RecordIncident(ctx, incidentID, incidentHash, time.Now().UTC().Format(time.RFC3339), "reporter1")
	assert.NoError(t, err)

	// Query evidence for the incident with no evidence
	results, err = contract.QueryEvidenceByIncident(ctx, incidentID)
	assert.NoError(t, err)
	assert.Len(t, results, 0)
}
func TestFullWorkflow(t *testing.T) {
	contract := SIHChaincode{}
	ctx := setupMockContext()

	// Step 1: Issue DID
	digitalID := "did:sih:workflow123"
	consentHash := "a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890"
	issuedAt := "2024-01-01T12:00:00Z"
	expiresAt := "2025-01-01T12:00:00Z"
	issuer := "Workflow Authority"

	didTxID, err := contract.IssueDID(ctx, digitalID, consentHash, issuedAt, expiresAt, issuer)
	assert.NoError(t, err)
	assert.NotEmpty(t, didTxID)

	// Step 2: Verify DID
	did, err := contract.VerifyDID(ctx, digitalID)
	assert.NoError(t, err)
	assert.Equal(t, digitalID, did.DigitalID)

	// Step 3: Record incident
	incidentID := "INC_WORKFLOW_001"
	incidentSummaryHash := "b1c2d3e4f5a6789012345678901234567890123456789012345678901234567890"
	createdAt := "2024-06-15T09:30:00Z"
	reporter := "reporter1"
	incTxID, err := contract.RecordIncident(ctx, incidentID, incidentSummaryHash, createdAt, reporter)
	assert.NoError(t, err)
	assert.NotEmpty(t, incTxID)

	// Step 4: Anchor evidence
	evidenceHash := "c1d2e3f4a5b6789012345678901234567890123456789012345678901234567890"
	mediaType := "image/png"
	uploader := "uploader1"
	evTxID, err := contract.AnchorEvidence(ctx, incidentID, evidenceHash, mediaType, uploader)
	assert.NoError(t, err)
	assert.NotEmpty(t, evTxID)

	// Step 5: Append audit entry
	auditHash := "d1e2f3a4b5c6789012345678901234567890123456789012345678901234567890"
	actor := "system"
	action := "FULL_WORKFLOW_TEST"
	targetID := digitalID
	auditTxID, err := contract.AppendAudit(ctx, auditHash, actor, action, targetID)
	assert.NoError(t, err)
	assert.NotEmpty(t, auditTxID)

	// Verify all documents exist
	_, err = contract.VerifyDID(ctx, digitalID)
	assert.NoError(t, err)

	incKey := fmt.Sprintf("INC#%s", incidentID)
	incBytes := ctx.stub.State[incKey]
	assert.NotNil(t, incBytes)

	evKey := fmt.Sprintf("EVIDENCE#%s", evidenceHash)
	evBytes := ctx.stub.State[evKey]
	assert.NotNil(t, evBytes)

	auditKey := fmt.Sprintf("AUDIT#%s", auditHash)
	auditBytes := ctx.stub.State[auditKey]
	assert.NotNil(t, auditBytes)
}

func BenchmarkIssueDID(b *testing.B) {
	contract := SIHChaincode{}
	
	for i := 0; i < b.N; i++ {
		ctx := setupMockContext()
		digitalID := fmt.Sprintf("did:sih:bench%d", i)
		consentHash := fmt.Sprintf("%063d%d", i, i%10)
		issuedAt := time.Now().UTC().Format(time.RFC3339)
		expiresAt := time.Now().AddDate(1, 0, 0).UTC().Format(time.RFC3339)
		issuer := "Benchmark Authority"

		_, err := contract.IssueDID(ctx, digitalID, consentHash, issuedAt, expiresAt, issuer)
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkRecordIncident(b *testing.B) {
	contract := SIHChaincode{}
	ctx := setupMockContext()
	
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		incidentID := fmt.Sprintf("INC%d", i)
		incidentSummaryHash := "b1c2d3e4f5a6789012345678901234567890123456789012345678901234567890"
		createdAt := time.Now().UTC().Format(time.RFC3339)
		reporter := "reporter1"
		_, err := contract.RecordIncident(ctx, incidentID, incidentSummaryHash, createdAt, reporter)
		if err != nil {
			b.Fatal(err)
		}
	}
}
