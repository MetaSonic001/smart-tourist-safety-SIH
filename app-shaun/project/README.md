# SafeTour - Tourist Safety Mobile App

SafeTour is a comprehensive Expo React Native mobile application designed to enhance tourist safety through real-time geofencing, emergency SOS features, location sharing, and offline functionality with full fallback to mock data.

## 🚀 Features

### Core Safety Features
- **Digital Tourist ID**: Secure QR-based identification system
- **Real-time Safety Scoring**: ML-powered individual and zone risk assessment
- **Geofencing Alerts**: Client-side polygon-based zone monitoring
- **Emergency SOS**: Multi-modal emergency assistance (button, voice, automatic)
- **Location Sharing**: Secure sharing with trusted contacts
- **Offline Mode**: Full functionality with local mock data fallback

### Technical Features
- **Background Location Tracking**: Optional continuous monitoring (user opt-in)
- **Voice SOS**: "I need help" voice command recognition
- **SMS/Call Fallbacks**: Emergency communication when internet fails
- **Multi-language Support**: English + Hindi (expandable)
- **Offline Maps**: Cached map tiles for offline navigation
- **Data Sync**: Queue and retry mechanism for offline operations

## 🏗️ Architecture

### Backend Integration (Ports 8001-8007)
- **Auth Service (8001)**: User onboarding and authentication
- **Blockchain Service (8002)**: Digital ID verification
- **Tourist Profile Service (8003)**: User data and check-ins
- **ML Service (8004)**: Safety scoring and predictions
- **Alerts Service (8005)**: SOS and emergency management
- **Dashboard Service (8006)**: Zone data and geofences
- **Operator Service (8007)**: Incident management

### Offline-First Design
All API calls automatically fallback to local mock data when servers are unreachable. Queued operations retry automatically when connection is restored.

## 📱 Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Expo CLI
- iOS Simulator/Android Emulator or physical device

### Install Dependencies
```bash
npm install
```

### Environment Configuration
Create `.env` file:
```
EXPO_PUBLIC_API_BASE_URL=http://localhost
EXPO_PUBLIC_USE_MOCK_DATA=false
```

### Run the App
```bash
# Start development server
npm run dev

# Run on specific platform
npx expo start --ios
npx expo start --android
npx expo start --web
```

## 🎮 Demo Mode

### Enable Mock Data Mode
1. Open the app
2. Go to **Settings** tab
3. Toggle **"Use Mock Data"** ON
4. App will immediately switch to offline demo mode

### Demo Credentials
```
Email: tourist_demo@demo.local
Password: Tourist@1234
Digital ID: DID-1111-2222
```

### Mock Data Locations
- `assets/mocks/zones.json` - Geofence polygons
- `assets/mocks/digital_id.json` - Demo user identity
- `assets/mocks/itinerary.json` - Sample travel plans
- `assets/mocks/nearby_places.json` - Police stations, hospitals
- `assets/mocks/incidents.json` - Sample safety incidents

## 🛠️ Testing SOS Flows

### Manual SOS Testing
1. Go to Home tab
2. Press and hold the red SOS button for 3 seconds
3. Confirm the emergency alert
4. Observe notification and call prompt

### Offline SOS Testing
1. Enable airplane mode or disconnect internet
2. Trigger SOS - alert will be queued locally
3. Restore connection - queued SOS will auto-send
4. Check notification confirming successful delivery

### Voice SOS Testing
1. Allow microphone permissions
2. Say "I need help" clearly
3. Confirm voice-triggered SOS alert

## 📍 Geofencing Demo

### Test Zones (Shillong, Meghalaya)
- **Safe Zone**: Police Bazaar (Low Risk)
- **Moderate Zone**: Laitumkhrah (Medium Risk) 
- **High Risk Zone**: Nongthymmai (High Risk)

### Testing Geofences
1. Enable location permissions
2. Open Map tab to see zone polygons
3. In mock mode, simulated location changes trigger alerts
4. High-risk zone entry shows immediate local notification

## 🔧 Key Components

### Context Providers
- **AppContext**: Global app state, user management
- **LocationContext**: GPS, geofencing, zone tracking
- **NotificationContext**: Push notifications, local alerts

### Core Services
- **ApiService**: HTTP client with mock fallback
- **MockDataService**: Local demo data provider
- **GeofenceService**: Client-side polygon checking
- **SOSService**: Emergency alert management

### UI Components
- **SOSButton**: Press-and-hold emergency trigger
- **SafetyScoreCard**: Real-time risk visualization
- **DigitalIDCard**: QR-based identity display
- **MapControls**: Interactive map functionality

## 🌐 API Integration

### Request Format
```typescript
// All API calls automatically fallback to mock data
const response = await ApiService.createSOS({
  alertId: 'sos-123',
  digitalId: 'DID-1111-2222',
  lat: 25.5788,
  lng: 91.8933,
  timestamp: new Date().toISOString(),
  source: 'app'
});
```

### Response Handling
```typescript
// Responses indicate data source
{
  data: {...},
  status: 'success' | 'mock' | 'error',
  message?: 'Additional info'
}
```

## 🔒 Security & Privacy

### Data Protection
- **Expo SecureStore**: Encrypted local storage for tokens
- **Location Opt-in**: Explicit user consent required
- **Secure Sharing**: Time-limited share tokens
- **Offline Privacy**: Mock mode uses no real user data

### Permissions
- **Location**: For safety monitoring and emergency response
- **Microphone**: For voice SOS commands
- **Notifications**: For safety alerts and updates
- **Phone**: For emergency calling (112)

## 🎯 Development Workflow

### Adding New Features
1. Create components in `components/` directory
2. Add types to `types/index.ts`
3. Implement services in `services/` directory  
4. Update mock data in `assets/mocks/`
5. Test both online and offline modes

### Mock Data Updates
1. Edit JSON files in `assets/mocks/`
2. Update `MockDataService.ts` if needed
3. Test toggle between real/mock data modes

### Background Tasks
Location tracking uses Expo TaskManager for background execution:
```typescript
// Defined in contexts/LocationContext.tsx
TaskManager.defineTask(LOCATION_TRACKING, ({ data, error }) => {
  // Handle background location updates
});
```

## 📊 Analytics & Monitoring

### Event Tracking
- SOS trigger events (success/failure)
- Geofence entry/exit events  
- Check-in completions
- Offline queue processing

### Performance Metrics
- Location accuracy and update frequency
- Battery usage optimization
- Network request success rates
- Mock vs real data usage patterns

## 🚀 Deployment

### Build for Production
```bash
# Build standalone apps
npx expo build:ios
npx expo build:android

# Or using EAS Build
npx eas build --platform all
```

### Environment Variables
Set production values:
```
EXPO_PUBLIC_API_BASE_URL=https://api.safetour.app
EXPO_PUBLIC_USE_MOCK_DATA=false
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/new-safety-feature`)
3. Commit changes (`git commit -am 'Add new safety feature'`)
4. Push to branch (`git push origin feature/new-safety-feature`)
5. Create Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 📞 Support

For technical support or emergency feature requests:
- Email: support@safetour.app
- Emergency: Always call 112 for immediate assistance
- Documentation: [docs.safetour.app](https://docs.safetour.app)

---

**Safety First**: This app is designed to enhance tourist safety but should never replace common sense, local awareness, and emergency services. Always prioritize your safety and follow local guidelines.