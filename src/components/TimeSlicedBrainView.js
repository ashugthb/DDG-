// TimeSlicedBrainView.js - Working version with proper animation

import React, { memo, useMemo, useRef, useState, useEffect } from "react";
import { Box, Typography, Grid, Divider, Paper } from "@mui/material";
import BrainVisualization from "./BrainVisualization";

// Simple time scale component
const TimeScale = memo(({ timeSlices, scanInterval }) => {
  // Calculate the total width based on the number of slices
  const totalMs = scanInterval || 100;
  const tickPoints = [0, 20, 40, 60, 80, 100];

  return (
    <Box
      sx={{
        width: "100%",
        height: 20, // Reduced height
        position: "relative",
        mb: 0.5, // Reduced margin
        mt: 0.5,
        px: 1,
      }}
    >
      {/* Horizontal line */}
      <Box
        sx={{
          position: "absolute",
          height: "1px",
          backgroundColor: "rgba(255,255,255,0.3)",
          width: "calc(100% - 10px)",
          top: 10,
          left: 5,
        }}
      />

      {/* Time ticks */}
      {tickPoints.map((percentage, index) => {
        
        const msValue = Math.round((percentage / 100) * totalMs);

        return (
          <Box
            key={index}
            sx={{
              position: "absolute",
              left: `calc(${percentage}% - 1px)`,
              top: 5,
              height: 10,
              width: "2px",
              backgroundColor: "rgba(255,255,255,0.5)",
            }}
          >
            <Typography
              variant="caption"
              sx={{
                position: "absolute",
                left: -15,
                top: 11,
                color: "rgba(255,255,255,0.7)",
                fontSize: "0.6rem",
                width: 30,
                textAlign: "center",
              }}
            >
              {msValue}us
            </Typography>
          </Box>
        );
      })}

      {/* MS Label */}
      <Typography
        variant="caption"
        sx={{
          position: "absolute",
          right: 0,
          top: 0,
          color: "rgba(255,255,255,0.7)",
          fontSize: "0.6rem",
        }}
      >
        us
      </Typography>
    </Box>
  );
});

// Individual brain visualization
const TimeSliceBrain = memo(
  ({ brain, channels, sliceIndex, sharedPulseTime }) => {
    const canvasRef = useRef(null);

    // Calculate transitions for this time slice
    const transitions = useMemo(
      () => channels?.reduce((sum, ch) => sum + (ch.transitions || 0), 0) || 0,
      [channels]
    );

    return (
      <Paper
        elevation={3}
        sx={{
          height: "100%",
          width: "100%",
          backgroundColor: "rgba(15, 15, 35, 0.7)",
          borderRadius: "4px",
          position: "relative",
          padding: "2px", // Reduced padding
          overflow: "hidden",
        }}
      >
        {/* Slice number label */}
        <Box
          sx={{
            position: "absolute",
            top: 3,
            left: 3,
            zIndex: 10,
            backgroundColor: "rgba(0,0,0,0.6)",
            color: "white",
            padding: "1px 4px",
            borderRadius: "3px",
            fontSize: "0.65rem",
          }}
        >
          {sliceIndex + 1}
        </Box>

        {/* Transitions counter */}
        <Box
          sx={{
            position: "absolute",
            bottom: 3,
            right: 3,
            zIndex: 10,
            backgroundColor: "rgba(0,0,0,0.6)",
            color: "white",
            borderRadius: "3px",
            padding: "1px 4px",
            fontSize: "0.65rem",
          }}
        >
          {transitions}
        </Box>

        {/* Brain visualization */}
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <BrainVisualization
            brainId={brain?.id || 0}
            brainData={{
              isActive: true, // Always show as active
              channels: channels || [],
              serialNumber: brain?.serialNumber || "Unknown",
              model: brain?.model || "Unknown",
              captureCount: brain?.captureCount || 0,
            }}
            pulseTime={sharedPulseTime + sliceIndex * 0.2} // Use shared pulse time with offset
            showNoActivity={false}
            canvasRef={canvasRef}
          />
        </Box>
      </Paper>
    );
  }
);

// Main component
const TimeSlicedBrainView = ({
  brain1,
  brain2,
  timeSlices,
  generateSliceData,
  settings,
  updateKey,
}) => {
  // Shared pulse time state for continuous animation
  const [pulseTime, setPulseTime] = useState(0);
  const requestRef = useRef(null);
  const previousTimeRef = useRef(0);

  // Animation loop for continuous pulse
  useEffect(() => {
    const animate = (time) => {
      if (previousTimeRef.current !== undefined) {
        // Update pulseTime by small increment each frame - SAME AS MultiBrainDashboard
        setPulseTime((prevPulseTime) => prevPulseTime + 0.02);
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // Safely generate time-sliced data for both brains
  const brain1SliceData = useMemo(() => {
    if (!brain1 || !timeSlices) return Array(timeSlices?.length || 5).fill([]);
    return timeSlices.map((slice, index) =>
      generateSliceData(brain1, slice, index)
    );
  }, [brain1, timeSlices, generateSliceData, updateKey]);

  const brain2SliceData = useMemo(() => {
    if (!brain2 || !timeSlices) return Array(timeSlices?.length || 5).fill([]);
    return timeSlices.map((slice, index) =>
      generateSliceData(brain2, slice, index)
    );
  }, [brain2, timeSlices, generateSliceData, updateKey]);

  // Safe counts of active channels
  const brain1ActiveChannels = useMemo(
    () =>
      brain1?.channels?.filter(
        (ch) => ch.activity > 0 || ch.totalTransitions > 0
      ).length || 0,
    [brain1]
  );

  const brain2ActiveChannels = useMemo(
    () =>
      brain2?.channels?.filter(
        (ch) => ch.activity > 0 || ch.totalTransitions > 0
      ).length || 0,
    [brain2]
  );

  // Get scan intervals
  const scanInterval1 = brain1?.scanInterval || 100;
  const scanInterval2 = brain2?.scanInterval || 100;

  // Default timeSlices if not provided
  const defaultTimeSlices = useMemo(() => {
    if (timeSlices && timeSlices.length > 0) return timeSlices;

    const interval = scanInterval1;
    const sliceSize = interval / 5;
    return Array.from({ length: 5 }, (_, i) => ({
      start: i * sliceSize,
      end: (i + 1) * sliceSize,
      label: `${Math.round(i * sliceSize)}ms - ${Math.round(
        (i + 1) * sliceSize
      )}ms`,
    }));
  }, [timeSlices, scanInterval1]);

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Title */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 0.5,
          height: 24,
        }}
      >
        <Typography variant="h6" color="primary.main" sx={{ fontSize: "1rem" }}>
          Time-Sliced Neural Activity
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontSize: "0.75rem" }}
        >
          Visualizing activity across {defaultTimeSlices.length} time segments
        </Typography>
      </Box>

      {/* Brain 1 Row */}
      <Box sx={{ mb: 0.5 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            mb: 0.5,
            px: 0.5,
            height: 16,
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              mr: 2,
              fontWeight: "bold",
              color: "primary.light",
              fontSize: "0.8rem",
            }}
          >
            Brain {brain1 ? brain1.id + 1 : "?"} ({brain1?.model || "Unknown"})
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mr: 2, fontSize: "0.75rem" }}
          >
            Active: {brain1ActiveChannels}
          </Typography>

          {brain1?.isActive ? (
            <Typography
              variant="body2"
              sx={{ color: "success.main", fontSize: "0.75rem" }}
            >
              ACTIVE
            </Typography>
          ) : (
            <Typography
              variant="body2"
              sx={{ color: "text.disabled", fontSize: "0.75rem" }}
            >
              INACTIVE
            </Typography>
          )}
        </Box>

        {/* Time scale for Brain 1 */}
        <TimeScale
          timeSlices={defaultTimeSlices}
          scanInterval={scanInterval1}
        />

        {/* Brain visualizations */}
        <Box sx={{ height: "200px" }}>
          <Grid
            container
            spacing={1}
            sx={{
              height: "100%",
              flexWrap: "nowrap", // Prevent wrapping
              justifyContent: "space-between",
            }}
          >
            {defaultTimeSlices.map((_, idx) => (
              <Grid
                item
                xs={12 / 5}
                key={idx}
                sx={{
                  flex: "1 0 18%", // Distribute space evenly
                  maxWidth: "20%", // Max 5 per row
                  height: "100%",
                  minWidth: 150, // Minimum width
                  position: "relative",
                  mt:3
                }}
              >
                <TimeSliceBrain
                  brain={brain1}
                  channels={brain1SliceData[idx]}
                  sliceIndex={idx}
                  sharedPulseTime={pulseTime}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>

      <Divider sx={{ my: 0.5, borderColor: "rgba(100, 100, 255, 0.2)" }} />

      {/* Brain 2 Row */}
      <Box sx={{ mt: 4 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            mb: 0.5,
            px: 0.5,
            height: 16,
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              mr: 2,
              fontWeight: "bold",
              color: "secondary.light",
              fontSize: "0.8rem",
            }}
          >
            Brain {brain2 ? brain2.id + 1 : "?"} ({brain2?.model || "Unknown"})
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mr: 2, fontSize: "0.75rem" }}
          >
            Active: {brain2ActiveChannels}
          </Typography>

          {brain2?.isActive ? (
            <Typography
              variant="body2"
              sx={{ color: "success.main", fontSize: "0.75rem" }}
            >
              ACTIVE
            </Typography>
          ) : (
            <Typography
              variant="body2"
              sx={{ color: "text.disabled", fontSize: "0.75rem" }}
            >
              INACTIVE
            </Typography>
          )}
        </Box>

        {/* Time scale for Brain 2 */}
        <TimeScale
          timeSlices={defaultTimeSlices}
          scanInterval={scanInterval2}
        />

        {/* Brain visualizations */}
        <Box sx={{ height: "200px" }}>
          <Grid
            container
            spacing={1}
            sx={{
              height: "100%",
              flexWrap: "nowrap", // Prevent wrapping
              justifyContent: "space-between",
              mt: 3,
            }}
          >
            {defaultTimeSlices.map((_, idx) => (
              <Grid
                item
                xs={12 / 5}
                key={idx}
                sx={{
                  flex: "1 0 18%", // Distribute space evenly
                  maxWidth: "20%", // Max 5 per row
                  height: "100%",
                  minWidth: 150, // Minimum width
                  position: "relative",
                }}
              >
                <TimeSliceBrain
                  brain={brain2}
                  channels={brain2SliceData[idx]}
                  sliceIndex={idx}
                  sharedPulseTime={pulseTime}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    </Box>
  );
};

export default memo(TimeSlicedBrainView);
