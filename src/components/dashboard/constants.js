export const BRAIN_DETAIL_URL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:3000/brain-detail'
  : `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/brain-detail`;

export const COLOR_SCALES = {
  default: {
    noActivity: "#081d58",
    veryLow: "#0d47a1",
    low: "#1565c0",
    lowMedium: "#1976d2",
    medium: "#2196f3",
    mediumHigh: "#ff9800",
    high: "#f57c00",
    veryHigh: "#e65100",
    extreme: "#d32f2f",
    peak: "#b71c1c",
  },
  alternative: {
    noActivity: "#0a1172",
    veryLow: "#0f2027",
    low: "#203a43",
    lowMedium: "#2c5364",
    medium: "#00796b",
    mediumHigh: "#ffc107",
    high: "#ff9800",
    veryHigh: "#ff5722",
    extreme: "#bf360c",
    peak: "#801313",
  },
};

export const SAMPLE_RATE_LABELS = {
  0: '1 MHz',
  1: '2 MHz',
  2: '5 MHz',
  3: '10 MHz',
  4: '20 MHz',
  5: '25 MHz',
  6: '50 MHz',
  7: '80 MHz',
  8: '100 MHz',
  9: '125 MHz',
  10: '200 MHz',
  11: '250 MHz',
  12: '400 MHz',
};

export const getActivityColor = (activityLevel, isActive, colorTheme = 'default') => {
  if (!isActive) return "rgba(13, 71, 161, 0.5)";
  const colors = COLOR_SCALES[colorTheme] || COLOR_SCALES.default;
  if (activityLevel <= 0) return colors.noActivity;
  if (activityLevel < 0.1) return colors.veryLow;
  if (activityLevel < 0.2) return colors.low;
  if (activityLevel < 0.3) return colors.lowMedium;
  if (activityLevel < 0.4) return colors.medium;
  if (activityLevel < 0.6) return colors.mediumHigh;
  if (activityLevel < 0.7) return colors.high;
  if (activityLevel < 0.8) return colors.veryHigh;
  if (activityLevel < 0.9) return colors.extreme;
  return colors.peak;
};
