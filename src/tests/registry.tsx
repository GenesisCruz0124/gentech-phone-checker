import type { TestModule } from '../types';
import {
  DeadPixelTest,
  BurnInTest,
  BacklightTest,
  GradientTest,
  BrightnessTest,
  RefreshRateTest,
} from './screen';
import {
  GridTest,
  MultiTouchTest,
  LineDrawTest,
  GhostTouchTest,
  EdgeTouchTest,
  LatencyTest,
} from './touch';
import { MicrophoneTest, LoudspeakerTest, EarpieceTest } from './audio';
import { FrontCameraTest, BackCameraTest, TorchTest } from './cameras';
import {
  VibrationTest,
  GyroTest,
  CompassTest,
  GpsTest,
  VolumeButtonTest,
  PowerButtonTest,
  BiometricTest,
} from './sensors';
import {
  OnlineStatusTest,
  SpeedTest,
  BluetoothTest,
  BatteryTest,
  SimCarrierTest,
} from './connectivity';

export const TESTS: TestModule[] = [
  // Screen / LCD
  { id: 'dead-pixel', title: 'Dead Pixel', category: 'Screen / LCD', supportedOn: 'all', blurb: 'Solid colors para hanapin ang dead/stuck pixels', Component: DeadPixelTest },
  { id: 'burn-in', title: 'Burn-in / Ghosting', category: 'Screen / LCD', supportedOn: 'all', blurb: 'Checkerboard + gray para sa AMOLED burn-in', Component: BurnInTest },
  { id: 'backlight', title: 'Backlight Bleed', category: 'Screen / LCD', supportedOn: 'all', blurb: 'Itim na screen para sa light bleed / uniformity', Component: BacklightTest },
  { id: 'gradient', title: 'Gradient Banding', category: 'Screen / LCD', supportedOn: 'all', blurb: 'Smooth gradients — banding = murang LCD', Component: GradientTest },
  { id: 'brightness', title: 'Brightness Response', category: 'Screen / LCD', supportedOn: 'all', blurb: 'Slide min→max sa mid-gray screen', Component: BrightnessTest },
  { id: 'refresh-rate', title: 'Refresh Rate', category: 'Screen / LCD', supportedOn: 'all', blurb: 'Sukatin ang Hz (60/90/120)', Component: RefreshRateTest },

  // Touchscreen
  { id: 'touch-grid', title: 'Touch Grid', category: 'Touchscreen', supportedOn: 'all', blurb: 'I-swipe lahat para hanapin ang dead zones', Component: GridTest },
  { id: 'multi-touch', title: 'Multi-touch', category: 'Touchscreen', supportedOn: 'all', blurb: 'Bilangin ang sabay na touch points (≥5)', Component: MultiTouchTest },
  { id: 'line-draw', title: 'Line Drawing', category: 'Touchscreen', supportedOn: 'all', blurb: 'Guhit test para sa digitizer jitter', Component: LineDrawTest },
  { id: 'ghost-touch', title: 'Ghost Touch', category: 'Touchscreen', supportedOn: 'all', blurb: '30s na walang hawak — dapat walang touch', Component: GhostTouchTest },
  { id: 'edge-touch', title: 'Edge Touch', category: 'Touchscreen', supportedOn: 'all', blurb: 'Gilid at corners dapat tumugon lahat', Component: EdgeTouchTest },
  { id: 'latency', title: 'Touch Latency', category: 'Touchscreen', supportedOn: 'all', blurb: 'Tuldok na sumusunod sa daliri', Component: LatencyTest },

  // Audio
  { id: 'microphone', title: 'Microphone', category: 'Audio', supportedOn: 'all', blurb: 'Waveform + record/playback loop', Component: MicrophoneTest },
  { id: 'loudspeaker', title: 'Loudspeaker', category: 'Audio', supportedOn: 'all', blurb: 'Test tones + stereo L/R pan', Component: LoudspeakerTest },
  { id: 'earpiece', title: 'Earpiece', category: 'Audio', supportedOn: 'all', blurb: 'Guided — idikit sa tenga sa low volume', Component: EarpieceTest },

  // Cameras
  { id: 'front-camera', title: 'Front Camera', category: 'Cameras', supportedOn: 'all', blurb: 'Live preview + capture frame', Component: FrontCameraTest },
  { id: 'back-camera', title: 'Back Camera', category: 'Cameras', supportedOn: 'all', blurb: 'Preview + multi-lens switch', Component: BackCameraTest },
  { id: 'torch', title: 'Flashlight / Torch', category: 'Cameras', supportedOn: 'android', blurb: 'Toggle torch (Android Chrome)', Component: TorchTest },

  // Sensors & Buttons
  { id: 'vibration', title: 'Vibration', category: 'Sensors & Buttons', supportedOn: 'android', blurb: 'Vibration pattern (Android)', Component: VibrationTest },
  { id: 'gyro', title: 'Gyro / Accelerometer', category: 'Sensors & Buttons', supportedOn: 'all', blurb: 'Bubble level visualization', Component: GyroTest },
  { id: 'compass', title: 'Compass', category: 'Sensors & Buttons', supportedOn: 'all', blurb: 'Heading readout', Component: CompassTest },
  { id: 'gps', title: 'GPS', category: 'Sensors & Buttons', supportedOn: 'all', blurb: 'Accuracy + lock time (walang coords stored)', Component: GpsTest },
  { id: 'volume-buttons', title: 'Volume Buttons', category: 'Sensors & Buttons', supportedOn: 'all', blurb: 'Guided — pindutin habang may tugtog', Component: VolumeButtonTest },
  { id: 'power-button', title: 'Power Button', category: 'Sensors & Buttons', supportedOn: 'all', blurb: 'Semi-auto lock/unlock detect', Component: PowerButtonTest },
  { id: 'biometric', title: 'Fingerprint / Face ID', category: 'Sensors & Buttons', supportedOn: 'all', blurb: 'WebAuthn responder test', Component: BiometricTest },

  // Connectivity & Power
  { id: 'online-status', title: 'Online / Connection', category: 'Connectivity & Power', supportedOn: 'all', blurb: 'Online status + connection type', Component: OnlineStatusTest },
  { id: 'speed-test', title: 'Speed Test', category: 'Connectivity & Power', supportedOn: 'all', blurb: 'Download Mbps (median ng 3)', Component: SpeedTest },
  { id: 'bluetooth', title: 'Bluetooth', category: 'Connectivity & Power', supportedOn: 'android', blurb: 'Scan devices (Android Chrome)', Component: BluetoothTest },
  { id: 'battery', title: 'Battery & Charging', category: 'Connectivity & Power', supportedOn: 'android', blurb: 'Level + charging port test (Android)', Component: BatteryTest },
  { id: 'sim-carrier', title: 'SIM / Carrier', category: 'Connectivity & Power', supportedOn: 'all', blurb: 'Guided signal + test call', Component: SimCarrierTest },
];

export const CATEGORIES = [
  'Screen / LCD',
  'Touchscreen',
  'Audio',
  'Cameras',
  'Sensors & Buttons',
  'Connectivity & Power',
] as const;
