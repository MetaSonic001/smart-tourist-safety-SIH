import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Image,
  Dimensions
} from 'react-native';
import { ChevronLeft, ChevronRight, Upload, Camera, User, Phone, MapPin, Shield, CircleCheck as CheckCircle, Globe } from 'lucide-react-native';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [formData, setFormData] = useState({
    name: '',
    nationality: 'Indian',
    documentType: 'aadhaar',
    documentNumber: '',
    emergencyContact1: { name: '', phone: '' },
    emergencyContact2: { name: '', phone: '' },
    tripType: 'manual'
  });

  const languages = [
    'English', 'हिंदी', 'தமிழ்', 'বাংলা', 'తెలుగు', 
    'मराठी', 'ગુજરાતી', 'ಕನ್ನಡ', 'മലയാളം', 'ਪੰਜਾਬੀ', 'اردو'
  ];

  const steps = [
    { title: 'Welcome', subtitle: 'Choose your language' },
    { title: 'Identity', subtitle: 'Verify your identity' },
    { title: 'Emergency', subtitle: 'Add emergency contacts' },
    { title: 'Travel Plan', subtitle: 'Set your itinerary' },
    { title: 'Complete', subtitle: 'Your Digital ID is ready' }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      router.replace('/(tabs)');
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      {steps.map((_, index) => (
        <View
          key={index}
          style={[
            styles.progressDot,
            index <= currentStep ? styles.progressDotActive : styles.progressDotInactive
          ]}
        />
      ))}
    </View>
  );

  const renderLanguageStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.welcomeTitle}>Travel Smart. Travel Safe.</Text>
        <Text style={styles.stepDescription}>
          Select your preferred language to continue
        </Text>
      </View>

      <ScrollView style={styles.languageContainer} showsVerticalScrollIndicator={false}>
        {languages.map((language, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.languageOption,
              selectedLanguage === language && styles.languageOptionSelected
            ]}
            onPress={() => setSelectedLanguage(language)}
          >
            <Globe size={20} color={selectedLanguage === language ? '#3B82F6' : '#6B7280'} />
            <Text style={[
              styles.languageText,
              selectedLanguage === language && styles.languageTextSelected
            ]}>
              {language}
            </Text>
            {selectedLanguage === language && <CheckCircle size={20} color="#3B82F6" />}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderIdentityStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Verify Your Identity</Text>
        <Text style={styles.stepDescription}>
          Upload your Aadhaar or Passport for secure verification
        </Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Full Name</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter your full name"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Document Type</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={[
                styles.radioOption,
                formData.documentType === 'aadhaar' && styles.radioOptionSelected
              ]}
              onPress={() => setFormData({ ...formData, documentType: 'aadhaar' })}
            >
              <Text style={[
                styles.radioText,
                formData.documentType === 'aadhaar' && styles.radioTextSelected
              ]}>
                Aadhaar Card
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.radioOption,
                formData.documentType === 'passport' && styles.radioOptionSelected
              ]}
              onPress={() => setFormData({ ...formData, documentType: 'passport' })}
            >
              <Text style={[
                styles.radioText,
                formData.documentType === 'passport' && styles.radioTextSelected
              ]}>
                Passport
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Document Number</Text>
          <TextInput
            style={styles.textInput}
            placeholder={formData.documentType === 'aadhaar' ? 'Enter Aadhaar number' : 'Enter passport number'}
            value={formData.documentNumber}
            onChangeText={(text) => setFormData({ ...formData, documentNumber: text })}
          />
        </View>

        <View style={styles.uploadSection}>
          <Text style={styles.inputLabel}>Upload Document</Text>
          <View style={styles.uploadOptions}>
            <TouchableOpacity
              style={styles.uploadOption}
              onPress={() => Alert.alert('Camera', 'Opening camera to scan document...')}
            >
              <Camera size={24} color="#3B82F6" />
              <Text style={styles.uploadOptionText}>Scan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.uploadOption}
              onPress={() => Alert.alert('Upload', 'Opening gallery to upload document...')}
            >
              <Upload size={24} color="#3B82F6" />
              <Text style={styles.uploadOptionText}>Upload</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  const renderEmergencyStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Emergency Contacts</Text>
        <Text style={styles.stepDescription}>
          Add contacts who will be notified in case of emergency
        </Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Primary Contact</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Emergency contact name"
              value={formData.emergencyContact1.name}
              onChangeText={(text) => setFormData({
                ...formData,
                emergencyContact1: { ...formData.emergencyContact1, name: text }
              })}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.textInput}
              placeholder="+91 XXXXX XXXXX"
              keyboardType="phone-pad"
              value={formData.emergencyContact1.phone}
              onChangeText={(text) => setFormData({
                ...formData,
                emergencyContact1: { ...formData.emergencyContact1, phone: text }
              })}
            />
          </View>
        </View>

        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Secondary Contact (Optional)</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Secondary contact name"
              value={formData.emergencyContact2.name}
              onChangeText={(text) => setFormData({
                ...formData,
                emergencyContact2: { ...formData.emergencyContact2, name: text }
              })}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.textInput}
              placeholder="+91 XXXXX XXXXX"
              keyboardType="phone-pad"
              value={formData.emergencyContact2.phone}
              onChangeText={(text) => setFormData({
                ...formData,
                emergencyContact2: { ...formData.emergencyContact2, phone: text }
              })}
            />
          </View>
        </View>
      </View>
    </View>
  );

  const renderTravelPlanStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Travel Itinerary</Text>
        <Text style={styles.stepDescription}>
          How would you like to plan your trip?
        </Text>
      </View>

      <View style={styles.planOptions}>
        <TouchableOpacity
          style={[
            styles.planOption,
            formData.tripType === 'manual' && styles.planOptionSelected
          ]}
          onPress={() => setFormData({ ...formData, tripType: 'manual' })}
        >
          <MapPin size={32} color={formData.tripType === 'manual' ? '#3B82F6' : '#6B7280'} />
          <Text style={[
            styles.planOptionTitle,
            formData.tripType === 'manual' && styles.planOptionTitleSelected
          ]}>
            Upload My Plan
          </Text>
          <Text style={styles.planOptionDescription}>
            I already have a travel itinerary ready
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.planOption,
            formData.tripType === 'ai' && styles.planOptionSelected
          ]}
          onPress={() => setFormData({ ...formData, tripType: 'ai' })}
        >
          <Shield size={32} color={formData.tripType === 'ai' ? '#3B82F6' : '#6B7280'} />
          <Text style={[
            styles.planOptionTitle,
            formData.tripType === 'ai' && styles.planOptionTitleSelected
          ]}>
            Plan with AI
          </Text>
          <Text style={styles.planOptionDescription}>
            Get AI-generated safe travel suggestions
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCompleteStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.completeHeader}>
        <View style={styles.successIcon}>
          <CheckCircle size={64} color="#10B981" />
        </View>
        <Text style={styles.completeTitle}>Digital ID Created!</Text>
        <Text style={styles.completeDescription}>
          Your tourist digital identity has been successfully created and verified on blockchain.
        </Text>
      </View>

      <View style={styles.digitalIdCard}>
        <View style={styles.idHeader}>
          <Text style={styles.idTitle}>TOURIST DIGITAL ID</Text>
          <View style={styles.verifiedBadge}>
            <Shield size={16} color="#10B981" />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        </View>
        
        <View style={styles.idContent}>
          <View style={styles.idLeft}>
            <View style={styles.profileImagePlaceholder}>
              <User size={24} color="#6B7280" />
            </View>
          </View>
          <View style={styles.idRight}>
            <Text style={styles.idName}>{formData.name || 'Tourist Name'}</Text>
            <Text style={styles.idNationality}>{formData.nationality}</Text>
            <Text style={styles.idNumber}>TID-2025-001234</Text>
            <Text style={styles.idValidity}>Valid: Jan 15 - 25, 2025</Text>
          </View>
        </View>

        <View style={styles.qrPlaceholder}>
          <Text style={styles.qrText}>QR Code</Text>
        </View>
      </View>

      <View style={styles.emergencyInfo}>
        <Text style={styles.emergencyTitle}>Emergency Contacts Added:</Text>
        <Text style={styles.emergencyContact}>• Emergency Services (112)</Text>
        <Text style={styles.emergencyContact}>• Tourist Helpline (1363)</Text>
        {formData.emergencyContact1.name && (
          <Text style={styles.emergencyContact}>• {formData.emergencyContact1.name}</Text>
        )}
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderLanguageStep();
      case 1:
        return renderIdentityStep();
      case 2:
        return renderEmergencyStep();
      case 3:
        return renderTravelPlanStep();
      case 4:
        return renderCompleteStep();
      default:
        return renderLanguageStep();
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return selectedLanguage !== '';
      case 1:
        return formData.name && formData.documentNumber;
      case 2:
        return formData.emergencyContact1.name && formData.emergencyContact1.phone;
      case 3:
        return formData.tripType !== '';
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {currentStep > 0 && currentStep < 4 && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ChevronLeft size={24} color="#6B7280" />
          </TouchableOpacity>
        )}
        <View style={styles.stepInfo}>
          <Text style={styles.stepCounter}>
            Step {currentStep + 1} of {steps.length}
          </Text>
          <Text style={styles.stepTitle}>{steps[currentStep].title}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {renderProgressBar()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderCurrentStep()}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            !canProceed() && styles.nextButtonDisabled
          ]}
          onPress={handleNext}
          disabled={!canProceed()}
        >
          <Text style={[
            styles.nextButtonText,
            !canProceed() && styles.nextButtonTextDisabled
          ]}>
            {currentStep === 4 ? 'Get Started' : 'Continue'}
          </Text>
          <ChevronRight size={20} color={canProceed() ? '#FFFFFF' : '#9CA3AF'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepInfo: {
    alignItems: 'center',
  },
  stepCounter: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  progressDotActive: {
    backgroundColor: '#3B82F6',
  },
  progressDotInactive: {
    backgroundColor: '#E5E7EB',
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  languageContainer: {
    flex: 1,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  languageOptionSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  languageText: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
    flex: 1,
  },
  languageTextSelected: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  formContainer: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  radioOption: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  radioOptionSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  radioText: {
    fontSize: 14,
    color: '#1F2937',
  },
  radioTextSelected: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  uploadSection: {
    marginTop: 16,
  },
  uploadOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadOption: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  uploadOptionText: {
    fontSize: 14,
    color: '#3B82F6',
    marginTop: 8,
    fontWeight: '500',
  },
  contactSection: {
    marginBottom: 24,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  planOptions: {
    flex: 1,
    gap: 16,
  },
  planOption: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  planOptionSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  planOptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 8,
  },
  planOptionTitleSelected: {
    color: '#3B82F6',
  },
  planOptionDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  completeHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  successIcon: {
    marginBottom: 16,
  },
  completeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  completeDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  digitalIdCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  idHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  idTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3B82F6',
    letterSpacing: 1,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 12,
    color: '#15803D',
    fontWeight: '500',
  },
  idContent: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  idLeft: {
    marginRight: 16,
  },
  profileImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  idRight: {
    flex: 1,
  },
  idName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  idNationality: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  idNumber: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
    marginBottom: 4,
  },
  idValidity: {
    fontSize: 12,
    color: '#6B7280',
  },
  qrPlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  qrText: {
    fontSize: 10,
    color: '#6B7280',
  },
  emergencyInfo: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
  },
  emergencyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 8,
  },
  emergencyContact: {
    fontSize: 13,
    color: '#991B1B',
    marginBottom: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  nextButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  nextButtonTextDisabled: {
    color: '#9CA3AF',
  },
});