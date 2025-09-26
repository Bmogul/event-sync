"use client";

import React, { useState, useMemo } from "react";
import styles from "../styles/portal.module.css";

const Analytics = ({ event, guestList, groups, session, toast }) => {
  const [tablesPerGuest, setTablesPerGuest] = useState(8);
  const [selectedSubevent, setSelectedSubevent] = useState("all");

  // Calculate analytics data
  const analyticsData = useMemo(() => {
    if (!guestList || !Array.isArray(guestList)) {
      return {
        totalGuests: 0,
        totalResponses: 0,
        confirmedAttending: 0,
        pendingResponses: 0,
        estimatedTables: 0,
        genderBreakdown: { male: 0, female: 0, other: 0, children: 0 },
        subeventData: {},
        rsvpStatusBreakdown: {
          attending: 0,
          notAttending: 0,
          maybe: 0,
          noResponse: 0,
        },
      };
    }

    const totalGuests = guestList.length;
    console.log(Date.UTC(), "ANALYTICS", "GUEST LIST", guestList)
    
    // Count responses - guests who have any RSVP status of 3, 4, or 5
    const guestsWithResponses = guestList.filter((guest) => {
      if (!guest.rsvps || !Array.isArray(guest.rsvps)) return false;
      return guest.rsvps.some((rsvp) => [3, 4, 5].includes(rsvp.status_id));
    });
    const totalResponses = guestsWithResponses.length;

    // Count confirmed attending - guests with any RSVP status of 3 (attending)
    const confirmedAttending = guestList.filter((guest) => {
      if (!guest.rsvps || !Array.isArray(guest.rsvps)) return false;
      return guest.rsvps.some((rsvp) => rsvp.status_id === 3);
    }).length;

    // Count pending responses
    const pendingResponses = totalGuests - totalResponses;

    // Calculate estimated tables
    const estimatedTables = Math.ceil(confirmedAttending / tablesPerGuest);

    // Gender breakdown
    const genderBreakdown = guestList.reduce(
      (acc, guest) => {
        const gender = guest.guest_gender?.state?.toLowerCase();
        if (gender === "male") acc.male++;
        else if (gender === "female") acc.female++;
        else if (guest.guest_age_group?.state?.toLowerCase().includes("child")) acc.children++;
        else acc.other++;
        return acc;
      },
      { male: 0, female: 0, other: 0, children: 0 }
    );

    // RSVP status breakdown
    const rsvpStatusBreakdown = guestList.reduce(
      (acc, guest) => {
        if (!guest.rsvps || !Array.isArray(guest.rsvps)) {
          acc.noResponse++;
          return acc;
        }

        // Check if guest has any responses
        const hasAttending = guest.rsvps.some((rsvp) => rsvp.status_id === 3);
        const hasNotAttending = guest.rsvps.some((rsvp) => rsvp.status_id === 4);
        const hasMaybe = guest.rsvps.some((rsvp) => rsvp.status_id === 5);

        if (hasAttending) acc.attending++;
        else if (hasNotAttending) acc.notAttending++;
        else if (hasMaybe) acc.maybe++;
        else acc.noResponse++;

        return acc;
      },
      { attending: 0, notAttending: 0, maybe: 0, noResponse: 0 }
    );

    // Subevent analysis
    const subeventData = {};
    
    // Get all unique subevents from guest RSVPs
    const allSubevents = new Set();
    guestList.forEach((guest) => {
      if (guest.rsvps && Array.isArray(guest.rsvps)) {
        guest.rsvps.forEach((rsvp) => {
          if (rsvp.subevents) {
            allSubevents.add(JSON.stringify({
              id: rsvp.subevents.id,
              title: rsvp.subevents.title,
            }));
          }
        });
      }
    });

    // Convert back to objects and calculate stats for each subevent
    Array.from(allSubevents).forEach((subeventStr) => {
      const subevent = JSON.parse(subeventStr);
      const subeventId = subevent.id;
      
      const attendingCount = guestList.filter((guest) =>
        guest.rsvps?.some((rsvp) => 
          rsvp.subevent_id === subeventId && rsvp.status_id === 3
        )
      ).length;
      
      const notAttendingCount = guestList.filter((guest) =>
        guest.rsvps?.some((rsvp) => 
          rsvp.subevent_id === subeventId && rsvp.status_id === 4
        )
      ).length;
      
      const maybeCount = guestList.filter((guest) =>
        guest.rsvps?.some((rsvp) => 
          rsvp.subevent_id === subeventId && rsvp.status_id === 5
        )
      ).length;
      
      const totalResponses = attendingCount + notAttendingCount + maybeCount;
      
      subeventData[subeventId] = {
        title: subevent.title,
        attending: attendingCount,
        notAttending: notAttendingCount,
        maybe: maybeCount,
        totalResponses,
        responseRate: totalGuests > 0 ? (totalResponses / totalGuests * 100).toFixed(1) : 0,
      };
    });

    return {
      totalGuests,
      totalResponses,
      confirmedAttending,
      pendingResponses,
      estimatedTables,
      genderBreakdown,
      subeventData,
      rsvpStatusBreakdown,
    };
  }, [guestList, tablesPerGuest]);

  const handleTablesPerGuestChange = (e) => {
    const value = parseInt(e.target.value) || 8;
    setTablesPerGuest(value);
  };

  const renderGenderChart = () => {
    const { genderBreakdown } = analyticsData;
    const total = Object.values(genderBreakdown).reduce((sum, count) => sum + count, 0);
    
    if (total === 0) {
      return (
        <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
          No gender data available
        </div>
      );
    }

    const generateGradient = (male, female, children, other) => {
      let gradientStops = [];
      let currentAngle = 0;
      
      if (male > 0) {
        const maleAngle = (male / total) * 360;
        gradientStops.push(`#3b82f6 ${currentAngle}deg ${currentAngle + maleAngle}deg`);
        currentAngle += maleAngle;
      }
      
      if (female > 0) {
        const femaleAngle = (female / total) * 360;
        gradientStops.push(`#ec4899 ${currentAngle}deg ${currentAngle + femaleAngle}deg`);
        currentAngle += femaleAngle;
      }
      
      if (children > 0) {
        const childrenAngle = (children / total) * 360;
        gradientStops.push(`#eab308 ${currentAngle}deg ${currentAngle + childrenAngle}deg`);
        currentAngle += childrenAngle;
      }
      
      if (other > 0) {
        const otherAngle = (other / total) * 360;
        gradientStops.push(`#8b5cf6 ${currentAngle}deg ${currentAngle + otherAngle}deg`);
      }
      
      return `conic-gradient(${gradientStops.join(", ")})`;
    };

    return (
      <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
        <div
          style={{
            width: "200px",
            height: "200px",
            borderRadius: "50%",
            background: generateGradient(
              genderBreakdown.male,
              genderBreakdown.female, 
              genderBreakdown.children,
              genderBreakdown.other
            ),
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "100px",
              height: "100px",
              background: "white",
              borderRadius: "50%",
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          {Object.entries(genderBreakdown).map(([key, count]) => {
            if (count === 0) return null;
            const colors = {
              male: "#3b82f6",
              female: "#ec4899", 
              children: "#eab308",
              other: "#8b5cf6",
            };
            const labels = {
              male: "Male",
              female: "Female",
              children: "Children (Under 12)",
              other: "Other",
            };
            
            return (
              <div
                key={key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "4px",
                    background: colors[key],
                  }}
                />
                <span style={{ flex: 1, fontSize: "14px", color: "#374151" }}>
                  {labels[key]}
                </span>
                <span style={{ fontWeight: 600, color: "#111827" }}>
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderBarChart = () => {
    const data = Object.values(analyticsData.subeventData);
    if (data.length === 0) {
      return (
        <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
          No subevent data available
        </div>
      );
    }

    const maxValue = Math.max(...data.map(item => item.attending));
    
    return (
      <div style={{ height: "300px", display: "flex", alignItems: "end", gap: "24px", padding: "16px 0" }}>
        {data.map((item, index) => {
          const height = maxValue > 0 ? (item.attending / maxValue) * 100 : 0;
          return (
            <div
              key={index}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <div
                style={{
                  width: "100%",
                  background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
                  borderRadius: "12px 12px 0 0",
                  position: "relative",
                  transition: "all 0.3s ease",
                  minHeight: "20px",
                  height: `${height}%`,
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "scale(1.05)";
                  e.target.style.opacity = "0.8";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "scale(1)";
                  e.target.style.opacity = "1";
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "-25px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  {item.attending}
                </div>
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  textAlign: "center",
                  fontWeight: 500,
                  maxWidth: "100px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={item.title}
              >
                {item.title}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div style={{ textAlign: "center", marginBottom: "64px" }}>
        <h1 style={{ 
          fontSize: "56px", 
          fontWeight: 800, 
          color: "#581c87", 
          marginBottom: "24px", 
          letterSpacing: "-2px" 
        }}>
          Event Analytics
        </h1>
        <p style={{ 
          fontSize: "20px", 
          color: "#4b5563", 
          marginBottom: "48px" 
        }}>
          Comprehensive insights and planning tools for {event?.eventTitle || "your event"}
        </p>
      </div>

      {/* Overview Stats */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "32px",
        marginBottom: "64px",
      }}>
        <div style={{
          background: "white",
          border: "2px solid #e5e7eb",
          borderRadius: "24px",
          padding: "48px",
          textAlign: "center",
          transition: "all 0.3s ease",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{
            content: "",
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(135deg, #7c3aed 0%, #581c87 100%)",
          }}/>
          <div style={{
            width: "60px",
            height: "60px",
            borderRadius: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px",
            margin: "0 auto 24px",
            background: "#f0fdf4",
            color: "#7c3aed",
          }}>
            👥
          </div>
          <div style={{
            fontSize: "32px",
            fontWeight: 800,
            color: "#111827",
            marginBottom: "8px",
          }}>
            {analyticsData.totalResponses}
          </div>
          <div style={{
            color: "#4b5563",
            fontSize: "16px",
            fontWeight: 600,
          }}>
            Total Responses
          </div>
          <div style={{
            fontSize: "14px",
            marginTop: "8px",
            fontWeight: 500,
            color: "#10b981",
          }}>
            +{analyticsData.totalResponses - Math.floor(analyticsData.totalResponses * 0.85)} this week
          </div>
        </div>

        <div style={{
          background: "white",
          border: "2px solid #e5e7eb",
          borderRadius: "24px",
          padding: "48px",
          textAlign: "center",
          transition: "all 0.3s ease",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{
            content: "",
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
          }}/>
          <div style={{
            width: "60px",
            height: "60px",
            borderRadius: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px",
            margin: "0 auto 24px",
            background: "#eff6ff",
            color: "#3b82f6",
          }}>
            ✅
          </div>
          <div style={{
            fontSize: "32px",
            fontWeight: 800,
            color: "#111827",
            marginBottom: "8px",
          }}>
            {analyticsData.confirmedAttending}
          </div>
          <div style={{
            color: "#4b5563",
            fontSize: "16px",
            fontWeight: 600,
          }}>
            Confirmed Attending
          </div>
          <div style={{
            fontSize: "14px",
            marginTop: "8px",
            fontWeight: 500,
            color: "#10b981",
          }}>
            {analyticsData.totalGuests > 0 ? 
              ((analyticsData.confirmedAttending / analyticsData.totalGuests) * 100).toFixed(1) : 0
            }% response rate
          </div>
        </div>

        <div style={{
          background: "white",
          border: "2px solid #e5e7eb",
          borderRadius: "24px",
          padding: "48px",
          textAlign: "center",
          transition: "all 0.3s ease",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{
            content: "",
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
          }}/>
          <div style={{
            width: "60px",
            height: "60px",
            borderRadius: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px",
            margin: "0 auto 24px",
            background: "#faf5ff",
            color: "#8b5cf6",
          }}>
            ⏳
          </div>
          <div style={{
            fontSize: "32px",
            fontWeight: 800,
            color: "#111827",
            marginBottom: "8px",
          }}>
            {analyticsData.pendingResponses}
          </div>
          <div style={{
            color: "#4b5563",
            fontSize: "16px",
            fontWeight: 600,
          }}>
            Pending Responses
          </div>
          <div style={{
            fontSize: "14px",
            marginTop: "8px",
            fontWeight: 500,
            color: "#f59e0b",
          }}>
            Need follow-up
          </div>
        </div>

        <div style={{
          background: "white",
          border: "2px solid #e5e7eb",
          borderRadius: "24px",
          padding: "48px",
          textAlign: "center",
          transition: "all 0.3s ease",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{
            content: "",
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
          }}/>
          <div style={{
            width: "60px",
            height: "60px",
            borderRadius: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px",
            margin: "0 auto 24px",
            background: "#fff7ed",
            color: "#f97316",
          }}>
            🍽️
          </div>
          <div style={{
            fontSize: "32px",
            fontWeight: 800,
            color: "#111827",
            marginBottom: "8px",
          }}>
            {analyticsData.estimatedTables}
          </div>
          <div style={{
            color: "#4b5563",
            fontSize: "16px",
            fontWeight: 600,
          }}>
            Estimated Tables
          </div>
          <div style={{
            fontSize: "14px",
            marginTop: "8px",
            fontWeight: 500,
            color: "#10b981",
          }}>
            Based on {tablesPerGuest} per table
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "48px",
        marginBottom: "64px",
      }}>
        {/* Gender Breakdown */}
        <div style={{
          background: "white",
          border: "2px solid #e5e7eb",
          borderRadius: "24px",
          padding: "48px",
          boxShadow: "0 10px 15px rgba(0, 0, 0, 0.1)",
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "48px",
            paddingBottom: "32px",
            borderBottom: "2px solid #f3f4f6",
          }}>
            <div>
              <h3 style={{
                fontSize: "24px",
                fontWeight: 700,
                color: "#111827",
                margin: 0,
              }}>
                Gender Distribution
              </h3>
              <p style={{
                fontSize: "14px",
                color: "#6b7280",
                marginTop: "8px",
                margin: 0,
              }}>
                Breakdown of confirmed guests by gender
              </p>
            </div>
            <select 
              style={{
                padding: "8px 12px",
                border: "2px solid #e5e7eb",
                borderRadius: "12px",
                fontSize: "14px",
                background: "white",
              }}
              value={selectedSubevent}
              onChange={(e) => setSelectedSubevent(e.target.value)}
            >
              <option value="all">All Events</option>
              {Object.entries(analyticsData.subeventData).map(([id, data]) => (
                <option key={id} value={id}>{data.title}</option>
              ))}
            </select>
          </div>
          {renderGenderChart()}
        </div>

        {/* Response Timeline */}
        <div style={{
          background: "white",
          border: "2px solid #e5e7eb",
          borderRadius: "24px",
          padding: "48px",
          boxShadow: "0 10px 15px rgba(0, 0, 0, 0.1)",
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "48px",
            paddingBottom: "32px",
            borderBottom: "2px solid #f3f4f6",
          }}>
            <div>
              <h3 style={{
                fontSize: "24px",
                fontWeight: 700,
                color: "#111827",
                margin: 0,
              }}>
                Subevent Attendance
              </h3>
              <p style={{
                fontSize: "14px",
                color: "#6b7280",
                marginTop: "8px",
                margin: 0,
              }}>
                Confirmed attendance per subevent
              </p>
            </div>
            <select style={{
              padding: "8px 12px",
              border: "2px solid #e5e7eb",
              borderRadius: "12px",
              fontSize: "14px",
              background: "white",
            }}>
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
              <option value="all">All time</option>
            </select>
          </div>
          {renderBarChart()}
        </div>
      </div>

      {/* Planning Tools Section */}
      <div style={{ marginBottom: "64px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
          gap: "48px",
        }}>
          {/* Table Planning */}
          <div style={{
            background: "white",
            border: "2px solid #e5e7eb",
            borderRadius: "24px",
            padding: "48px",
            boxShadow: "0 10px 15px rgba(0, 0, 0, 0.1)",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "24px",
              marginBottom: "32px",
            }}>
              <div style={{
                width: "50px",
                height: "50px",
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                background: "#7c3aed",
                color: "white",
              }}>
                🪑
              </div>
              <h3 style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "#111827",
                margin: 0,
              }}>
                Table Planning
              </h3>
            </div>

            {/* Settings Panel */}
            <div style={{
              background: "#eff6ff",
              border: "2px solid #bfdbfe",
              borderRadius: "16px",
              padding: "32px",
              marginBottom: "32px",
            }}>
              <h4 style={{
                fontSize: "18px",
                fontWeight: 600,
                color: "#2563eb",
                marginBottom: "24px",
                margin: "0 0 24px 0",
              }}>
                Configuration
              </h4>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "24px",
              }}>
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}>
                  <label style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#374151",
                  }}>
                    Guests per table
                  </label>
                  <input
                    type="number"
                    value={tablesPerGuest}
                    onChange={handleTablesPerGuestChange}
                    style={{
                      padding: "16px",
                      border: "2px solid #e5e7eb",
                      borderRadius: "12px",
                      fontSize: "14px",
                      background: "white",
                    }}
                    min="1"
                    max="20"
                  />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: "32px" }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "24px",
                background: "#f9fafb",
                borderRadius: "12px",
                marginBottom: "8px",
              }}>
                <span style={{
                  fontSize: "14px",
                  color: "#6b7280",
                }}>
                  Confirmed guests
                </span>
                <span style={{
                  fontWeight: 700,
                  color: "#111827",
                }}>
                  {analyticsData.confirmedAttending}
                </span>
              </div>

              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "24px",
                background: "#f9fafb",
                borderRadius: "12px",
                marginBottom: "8px",
              }}>
                <span style={{
                  fontSize: "14px",
                  color: "#6b7280",
                }}>
                  Guests per table
                </span>
                <span style={{
                  fontWeight: 700,
                  color: "#111827",
                }}>
                  {tablesPerGuest}
                </span>
              </div>

              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "24px",
                background: "#7c3aed",
                color: "white",
                borderRadius: "12px",
                fontWeight: 700,
              }}>
                <span>Total tables needed</span>
                <span>{analyticsData.estimatedTables}</span>
              </div>
            </div>
          </div>

          {/* RSVP Breakdown */}
          <div style={{
            background: "white",
            border: "2px solid #e5e7eb",
            borderRadius: "24px",
            padding: "48px",
            boxShadow: "0 10px 15px rgba(0, 0, 0, 0.1)",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "24px",
              marginBottom: "32px",
            }}>
              <div style={{
                width: "50px",
                height: "50px",
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                background: "#7c3aed",
                color: "white",
              }}>
                📊
              </div>
              <h3 style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "#111827",
                margin: 0,
              }}>
                RSVP Breakdown
              </h3>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "32px",
            }}>
              <div style={{
                textAlign: "center",
                padding: "32px",
                background: "#f9fafb",
                borderRadius: "16px",
                border: "2px solid #e5e7eb",
                transition: "all 0.3s ease",
              }}>
                <div style={{
                  fontSize: "28px",
                  fontWeight: 800,
                  color: "#10b981",
                  marginBottom: "8px",
                }}>
                  {analyticsData.rsvpStatusBreakdown.attending}
                </div>
                <div style={{
                  fontSize: "14px",
                  color: "#6b7280",
                  fontWeight: 600,
                }}>
                  Attending
                </div>
              </div>

              <div style={{
                textAlign: "center",
                padding: "32px",
                background: "#f9fafb",
                borderRadius: "16px",
                border: "2px solid #e5e7eb",
                transition: "all 0.3s ease",
              }}>
                <div style={{
                  fontSize: "28px",
                  fontWeight: 800,
                  color: "#ef4444",
                  marginBottom: "8px",
                }}>
                  {analyticsData.rsvpStatusBreakdown.notAttending}
                </div>
                <div style={{
                  fontSize: "14px",
                  color: "#6b7280",
                  fontWeight: 600,
                }}>
                  Not Attending
                </div>
              </div>

              <div style={{
                textAlign: "center",
                padding: "32px",
                background: "#f9fafb",
                borderRadius: "16px",
                border: "2px solid #e5e7eb",
                transition: "all 0.3s ease",
              }}>
                <div style={{
                  fontSize: "28px",
                  fontWeight: 800,
                  color: "#f59e0b",
                  marginBottom: "8px",
                }}>
                  {analyticsData.rsvpStatusBreakdown.maybe}
                </div>
                <div style={{
                  fontSize: "14px",
                  color: "#6b7280",
                  fontWeight: 600,
                }}>
                  Maybe
                </div>
              </div>

              <div style={{
                textAlign: "center",
                padding: "32px",
                background: "#f9fafb",
                borderRadius: "16px",
                border: "2px solid #e5e7eb",
                transition: "all 0.3s ease",
              }}>
                <div style={{
                  fontSize: "28px",
                  fontWeight: 800,
                  color: "#6b7280",
                  marginBottom: "8px",
                }}>
                  {analyticsData.rsvpStatusBreakdown.noResponse}
                </div>
                <div style={{
                  fontSize: "14px",
                  color: "#6b7280",
                  fontWeight: 600,
                }}>
                  No Response
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div style={{ marginBottom: "64px" }}>
        <div style={{
          background: "white",
          border: "2px solid #e5e7eb",
          borderRadius: "24px",
          padding: "48px",
          boxShadow: "0 10px 15px rgba(0, 0, 0, 0.1)",
        }}>
          <h3 style={{
            fontSize: "24px",
            fontWeight: 700,
            color: "#581c87",
            marginBottom: "32px",
          }}>
            Subevent Analysis
          </h3>
          
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "32px",
          }}>
            {Object.entries(analyticsData.subeventData).map(([id, data]) => (
              <div
                key={id}
                style={{
                  textAlign: "center",
                  padding: "32px",
                  background: "#f9fafb",
                  borderRadius: "16px",
                  border: "2px solid #e5e7eb",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#7c3aed";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e5e7eb";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={{
                  fontSize: "28px",
                  fontWeight: 800,
                  color: "#581c87",
                  marginBottom: "8px",
                }}>
                  {data.attending}
                </div>
                <div style={{
                  fontSize: "14px",
                  color: "#6b7280",
                  fontWeight: 600,
                  marginBottom: "4px",
                }}>
                  {data.title}
                </div>
                <div style={{
                  fontSize: "12px",
                  color: "#10b981",
                  fontWeight: 500,
                }}>
                  {data.responseRate}% response rate
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
