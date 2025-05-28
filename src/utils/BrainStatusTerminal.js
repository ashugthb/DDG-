import React, { useEffect, useRef } from "react";
import { Box, Typography, Paper, Divider } from "@mui/material";
import TerminalIcon from "@mui/icons-material/Terminal";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import SyncIcon from "@mui/icons-material/Sync";
import SignalCellularAltIcon from "@mui/icons-material/SignalCellularAlt";

const BrainStatusTerminal = ({ brainPairs }) => {
  const terminalRef = useRef(null);

  useEffect(() => {
    // Auto-scroll to bottom when content updates
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [brainPairs]);

  // Calculate pair-level statistics
  const getPairStats = (pair) => {
    if (!pair || !pair[0]) return null;

    const brain1 = pair[0];
    const brain2 = pair[1];

    const activeChannelsB1 = brain1?.channels?.filter(ch => ch.activity > 0)?.length || 0;
    const activeChannelsB2 = brain2?.channels?.filter(ch => ch.activity > 0)?.length || 0;
    const totalActiveChannels = activeChannelsB1 + activeChannelsB2;
    
    const avgActivityB1 = brain1?.channels?.reduce((sum, ch) => sum + ch.activity, 0) / 
                         (brain1?.channels?.length || 1);
    const avgActivityB2 = brain2?.channels?.reduce((sum, ch) => sum + ch.activity, 0) / 
                         (brain2?.channels?.length || 1);
    const combinedActivity = (avgActivityB1 + avgActivityB2) / 2;
    
    // Determine synchronization level based on activity patterns
    const activityDiff = Math.abs(avgActivityB1 - avgActivityB2);
    let syncLevel = "Unknown";
    
    if (activityDiff < 0.1) syncLevel = "High";
    else if (activityDiff < 0.3) syncLevel = "Medium";
    else syncLevel = "Low";
    
    return {
      totalActiveChannels,
      activeChannelsB1,
      activeChannelsB2,
      avgActivityB1: avgActivityB1.toFixed(2),
      avgActivityB2: avgActivityB2.toFixed(2),
      combinedActivity: combinedActivity.toFixed(2),
      syncLevel,
      isActive: brain1?.isActive && (brain2?.isActive || !brain2)
    };
  };

  return (
    <Paper
      elevation={3}
      sx={{
        backgroundColor: "rgba(16, 20, 24, 0.95)",
        color: "#00ff99",
        borderRadius: 2,
        overflow: "hidden",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        border: "1px solid rgba(0, 255, 153, 0.3)",
        boxShadow: "0 0 20px rgba(0, 255, 153, 0.15)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          padding: 1.2,
          borderBottom: "1px solid rgba(0, 255, 153, 0.3)",
          backgroundColor: "rgba(0, 0, 0, 0.6)",
        }}
      >
        <TerminalIcon sx={{ mr: 1, color: "#00ff99" }} />
        <Typography variant="subtitle1" fontFamily="'Roboto Mono', monospace" fontWeight="bold">
          NEURAL NETWORK STATUS
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <FiberManualRecordIcon 
          sx={{ 
            color: "#00ff99", 
            fontSize: 14,
            animation: "pulse 1.5s infinite ease-in-out",
            "@keyframes pulse": {
              "0%": { opacity: 0.4 },
              "50%": { opacity: 1 },
              "100%": { opacity: 0.4 }
            }
          }} 
        />
        <Box
          component="span"
          sx={{
            ml: 0.5,
            fontSize: "0.75rem",
            fontFamily: "'Roboto Mono', monospace",
          }}
        >
          ONLINE
        </Box>
      </Box>

      <Box
        ref={terminalRef}
        sx={{
          flexGrow: 1,
          overflow: "auto",
          padding: 1.5,
          fontFamily: "'Roboto Mono', monospace",
          fontSize: "0.75rem",
          "& > div": {
            marginBottom: 1.5,
          },
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-track": {
            background: "rgba(0,0,0,0.4)",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "rgba(0,255,153,0.5)",
            borderRadius: "4px",
          },
        }}
      >
        <Box component="div">
          <Typography
            component="div"
            sx={{ color: "#00ffff", mb: 1 }}
          >
            == SYSTEM INITIALIZATION COMPLETE ==
          </Typography>
          <Typography component="div">
             Monitoring {brainPairs.length} brain pairs
          </Typography>
          <Typography component="div">
             Total brains: {brainPairs.reduce((count, pair) => 
              count + (pair[0] ? 1 : 0) + (pair[1] ? 1 : 0), 0)}
          </Typography>
          <Typography component="div">
             Active scanning protocol engaged
          </Typography>
        </Box>

        <Divider sx={{ my: 2, borderColor: "rgba(0,255,153,0.3)", borderStyle: "dashed" }} />

        {brainPairs.map((pair, index) => {
          const stats = getPairStats(pair);
          if (!stats) return null;
          
          const activityColor = stats.combinedActivity > 0.7 ? "#ff5555" : 
                              stats.combinedActivity > 0.4 ? "#ffff00" : "#00ff99";
          
          return (
            <Box component="div" key={index} sx={{ mb: 2 }}>
              <Typography
                component="div"
                sx={{
                  color: "#00ffff",
                  display: "flex",
                  alignItems: "center",
                  fontWeight: "bold",
                }}
              >
                <FiberManualRecordIcon 
                  sx={{ 
                    fontSize: 10, 
                    mr: 0.5, 
                    color: stats.isActive ? "#00ff99" : "#ff0000" 
                  }} 
                />
                PAIR {index + 1} STATUS
              </Typography>
              
              <Box sx={{ ml: 2 }}>
                <Typography component="div" sx={{ display: "flex", alignItems: "center" }}>
                  <SignalCellularAltIcon sx={{ fontSize: 14, mr: 0.5 }} />
                  Activity Level: <Box component="span" sx={{ color: activityColor, ml: 0.5 }}>
                    {stats.combinedActivity} [{stats.combinedActivity < 0.3 ? "LOW" : 
                                            stats.combinedActivity < 0.7 ? "MEDIUM" : "HIGH"}]
                  </Box>
                </Typography>
                
                <Typography component="div">
                   Active Channels: {stats.totalActiveChannels}/
                  {(pair[0]?.channels?.length || 0) + (pair[1]?.channels?.length || 0)}
                </Typography>
                
                <Typography component="div">
                   Brain {pair[0]?.id + 1}: {stats.activeChannelsB1} channels @ {stats.avgActivityB1} avg
                </Typography>
                
                {pair[1] && (
                  <Typography component="div">
                    Brain {pair[1]?.id + 1}: {stats.activeChannelsB2} channels @ {stats.avgActivityB2} avg
                  </Typography>
                )}
                
                <Typography component="div" sx={{ display: "flex", alignItems: "center" }}>
                  <SyncIcon sx={{ fontSize: 14, mr: 0.5 }} />
                  Synchronization: <Box component="span" sx={{ 
                    color: stats.syncLevel === "High" ? "#00ff99" : 
                           stats.syncLevel === "Medium" ? "#ffff00" : "#ff5555",
                    ml: 0.5
                  }}>
                    {stats.syncLevel}
                  </Box>
                </Typography>
              </Box>
            </Box>
          );
        })}
        
        <Divider sx={{ my: 2, borderColor: "rgba(0,255,153,0.3)", borderStyle: "dashed" }} />
        
        <Box component="div">
          <Typography component="div" sx={{ color: "#00ffff", fontWeight: "bold" }}>
            == SYSTEM DIAGNOSTICS ==
          </Typography>
          <Typography component="div">
             All neural interfaces operational
          </Typography>
          <Typography component="div">
             Signal quality: Optimal
          </Typography>
          <Typography component="div">
             Awaiting further neural activity...
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default BrainStatusTerminal;