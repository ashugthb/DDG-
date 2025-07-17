import React from "react";
import { Box, Typography, Paper } from "@mui/material";

const ActivityScaleIndicator = () => {
  // Define the gradient stops for a detailed activity scale
  const gradientStops = [
    { level: "Critical", color: "#ff0000", value: "1.0" },
    { level: "Very High", color: "#ff3300", value: "0.9" },
    { level: "High", color: "#ff6600", value: "0.8" },
    { level: "Above Average", color: "#ff9900", value: "0.7" },
    { level: "Moderate High", color: "#ffcc00", value: "0.6" },
    { level: "Moderate", color: "#ffff00", value: "0.5" },
    { level: "Moderate Low", color: "#ccff00", value: "0.4" },
    { level: "Below Average", color: "#99ff00", value: "0.3" },
    { level: "Low", color: "#66ff00", value: "0.2" },
    { level: "Very Low", color: "#33ff00", value: "0.1" },
    { level: "Minimal", color: "#00ff00", value: "0.0" },
  ];

  return (
    <Paper
      elevation={3}
      sx={{
        position: "absolute",
        right: 20,
        top: 80,
        height: "70%",
        width: 140,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: "rgba(10, 15, 25, 0.85)",
        borderRadius: 2,
        padding: 2,
        border: "1px solid rgba(255,255,255,0.15)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{
          color: "#fff",
          textAlign: "center",
          mb: 1.5,
          fontWeight: "bold",
          borderBottom: "1px solid rgba(255,255,255,0.3)",
          width: "100%",
          paddingBottom: 0.5,
          letterSpacing: "1px",
        }}
      >
        ACTIVITY LEVELS
      </Typography>

      <Box sx={{ display: "flex", flexGrow: 1, width: "100%" }}>
        {/* Scale gradient bar */}
        <Box
          sx={{
            width: "30%",
            position: "relative",
            background: `linear-gradient(to bottom, ${gradientStops
              .map((stop) => stop.color)
              .join(", ")})`,
            borderRadius: 1,
            margin: "0 auto",
            boxShadow: "0 0 10px rgba(255,255,255,0.1) inset",
          }}
        >
          {/* Scale markers */}
          {[0, 0.2, 0.4, 0.6, 0.8, 1].map((value) => (
            <Box
              key={value}
              sx={{
                position: "absolute",
                left: "100%",
                top: `${100 - value * 100}%`,
                width: 4,
                height: 1,
                backgroundColor: "rgba(255,255,255,0.5)",
                transform: "translateY(-50%)",
              }}
            />
          ))}
        </Box>

        {/* Scale labels */}
        <Box sx={{ width: "70%", pl: 1.5 }}>
          {gradientStops.map((stop, index) => 
            // Only show some labels to avoid overcrowding
            index % 2 === 0 && (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 0.5,
                  height: `${100 / Math.ceil(gradientStops.length/2)}%`,
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    backgroundColor: stop.color,
                    borderRadius: "50%",
                    border: "1px solid rgba(255,255,255,0.3)",
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{ 
                    color: "#fff", 
                    fontSize: "0.7rem", 
                    flexGrow: 1, 
                    ml: 1,
                    textShadow: "0 0 5px rgba(0,0,0,0.7)" 
                  }}
                >
                  {stop.level}
                </Typography>
              </Box>
            )
          )}
        </Box>
      </Box>

      <Box sx={{ 
        width: "100%", 
        mt: 2, 
        pt: 2, 
        borderTop: "1px solid rgba(255,255,255,0.15)",
        textAlign: "center" 
      }}>
        <Typography variant="caption" sx={{ color: "#aaa", fontSize: "0.7rem" }}>
          Activity measured on<br />normalized scale (0-1)
        </Typography>
      </Box>
    </Paper>
  );
};

export default ActivityScaleIndicator;