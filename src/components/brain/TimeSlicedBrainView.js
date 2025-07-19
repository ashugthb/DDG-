// TimeSlicedBrainView.js - Futuristic visual update, layout unchanged

import React, { memo, useMemo, useRef, useState, useEffect } from "react";
import { Box, Typography, Grid, Divider, Paper } from "@mui/material";
import BrainVisualization from "./BrainVisualization";

// Simple time scale component
const TimeScale = memo(({ timeSlices, scanInterval }) => {
  const totalMs = scanInterval || 100;
  const tickPoints = [0, 20, 40, 60, 80, 100];

  return (
    <Box
      sx={{
        width: "100%",
        height: 20,
        position: "relative",
        mb: 0.5,
        mt: 0.5,
        px: 1,
      }}
    >
      {/* Glowing horizontal line */}
      <Box
        sx={{
          position: "absolute",
          height: "1px",
          background: "linear-gradient(90deg, #00f2ff, #8e2de2)",
          opacity: 0.5,
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
              backgroundColor: "rgba(0, 255, 255, 0.6)",
              boxShadow: "0 0 3px #00ffff",
            }}
          >
            <Typography
              variant="caption"
              sx={{
                position: "absolute",
                left: -15,
                top: 11,
                color: "#a0f0ff",
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
          color: "#a0f0ff",
          fontSize: "0.6rem",
        }}
      >
        us
      </Typography>
    </Box>
  );
});

// Individual brain visualization
const TimeSliceBrain = memo(({ brain, channels, sliceIndex, sharedPulseTime }) => {
  const canvasRef = useRef(null);
  console.log("Rendering TimeSliceBrain", { brain, channels, sliceIndex });

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
        background: "radial-gradient(circle, rgba(15,15,35,0.85) 0%, rgba(5,5,20,0.95) 100%)",
        borderRadius: "4px",
        position: "relative",
        padding: "2px",
        overflow: "hidden",
        border: "1px solid rgba(0, 255, 255, 0.15)",
        boxShadow: "0 0 8px rgba(0, 255, 255, 0.2)",
        transition: "transform 0.3s ease",
        "&:hover": {
          transform: "scale(1.01)",
          boxShadow: "0 0 10px rgba(0, 255, 255, 0.4)",
        },
      }}
    >
      {/* Slice number */}
      <Box
        sx={{
          position: "absolute",
          top: 3,
          left: 3,
          zIndex: 10,
          backgroundColor: "rgba(0,0,0,0.6)",
          color: "#00f2ff",
          padding: "1px 4px",
          borderRadius: "3px",
          fontSize: "0.65rem",
          fontWeight: "bold",
          textShadow: "0 0 2px #00ffff",
        }}
      >
        {sliceIndex + 1}
      </Box>

      {/* Transition count */}
      <Box
        sx={{
          position: "absolute",
          bottom: 3,
          right: 3,
          zIndex: 10,
          backgroundColor: "rgba(0,0,0,0.6)",
          color: "#8e2de2",
          borderRadius: "3px",
          padding: "1px 4px",
          fontSize: "0.65rem",
          fontWeight: "bold",
          textShadow: "0 0 2px #8e2de2",
        }}
      >
        {transitions}
      </Box>

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
            isActive: true,
            channels: channels || [],
            serialNumber: brain?.serialNumber || "Unknown",
            model: brain?.model || "Unknown",
            captureCount: brain?.captureCount || 0,
          }}
          pulseTime={sharedPulseTime + sliceIndex * 0.2}
          showNoActivity={false}
          canvasRef={canvasRef}
        />
      </Box>
    </Paper>
  );
});

// Main component
const TimeSlicedBrainView = ({
  brain1,
  brain2,
  timeSlices,
  generateSliceData,
  settings,
  updateKey,
}) => {
  const [pulseTime, setPulseTime] = useState(0);
  const requestRef = useRef(null);
  const previousTimeRef = useRef(0);

  useEffect(() => {
    const animate = (time) => {
      if (previousTimeRef.current !== undefined) {
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

  const scanInterval1 = brain1?.scanInterval || 100;
  const scanInterval2 = brain2?.scanInterval || 100;

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

      {/* Brain 1 */}
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

        <TimeScale timeSlices={defaultTimeSlices} scanInterval={scanInterval1} />

        <Box sx={{ height: "200px" }}>
          <Grid
            container
            spacing={1}
            sx={{
              height: "100%",
              flexWrap: "nowrap",
              justifyContent: "space-between",
            }}
          >
            {defaultTimeSlices.map((_, idx) => (
              <Grid
                item
                xs={12 / 5}
                key={idx}
                sx={{
                  flex: "1 0 18%",
                  maxWidth: "20%",
                  height: "100%",
                  minWidth: 150,
                  position: "relative",
                  mt: 3,
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

      {/* Brain 2 */}
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

        <TimeScale timeSlices={defaultTimeSlices} scanInterval={scanInterval2} />

        <Box sx={{ height: "200px" }}>
          <Grid
            container
            spacing={1}
            sx={{
              height: "100%",
              flexWrap: "nowrap",
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
                  flex: "1 0 18%",
                  maxWidth: "20%",
                  height: "100%",
                  minWidth: 150,
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