"use client";

import React, { useState, useMemo } from "react";
import styles from "../styles/portal.module.css";

const Analytics = ({ event, guestList, groups, session, toast }) => {
  const [tablesPerGuest, setTablesPerGuest] = useState(8);
  const [selectedSubevent, setSelectedSubevent] = useState(null); // Will be set to most popular subevent

  // Calculate analytics data
  const analyticsData = useMemo(() => {
    if (!guestList || !Array.isArray(guestList)) {
      return {
        totalGuests: 0,
        totalInvited: 0,
        subeventAttending: 0,
        pendingResponses: 0,
        estimatedTables: 0,
        genderBreakdown: { male: 0, female: 0, other: 0, children: 0 },
        subeventData: {},
        availableSubevents: [],
        mostPopularSubevent: null,
        rsvpStatusBreakdown: {
          attending: 0,
          notAttending: 0,
          maybe: 0,
          noResponse: 0,
        },
      };
    }

    const totalGuests = guestList.length;
    console.log(Date.UTC(), "ANALYTICS", "GUEST LIST", guestList);

    // Parse all subevents from rsvp_status objects
    const subeventData = {};
    const allSubevents = new Set();

    guestList.forEach((guest) => {
      if (guest.rsvp_status && typeof guest.rsvp_status === "object") {
        Object.entries(guest.rsvp_status).forEach(([eventTitle, rsvpData]) => {
          if (rsvpData && rsvpData.subevent_id) {
            const subeventKey = `${rsvpData.subevent_id}`;
            allSubevents.add(
              JSON.stringify({
                id: rsvpData.subevent_id,
                title: eventTitle,
              }),
            );

            // Initialize subevent data if not exists
            if (!subeventData[subeventKey]) {
              subeventData[subeventKey] = {
                id: rsvpData.subevent_id,
                title: eventTitle,
                totalInvited: 0,
                attending: 0,
                notAttending: 0,
                maybe: 0,
                noResponse: 0,
                totalAttendeeCount: 0, // Sum of response numbers
              };
            }

            // Count invitation
            subeventData[subeventKey].totalInvited++;

            // Count by status
            const statusId = rsvpData.status_id;
            const responseCount = parseInt(rsvpData.response) || 0;

            if (statusId === 3) {
              subeventData[subeventKey].attending++;
              subeventData[subeventKey].totalAttendeeCount += responseCount;
            } else if (statusId === 4) {
              subeventData[subeventKey].notAttending++;
            } else if (statusId === 5) {
              subeventData[subeventKey].maybe++;
              subeventData[subeventKey].totalAttendeeCount += responseCount;
            } else {
              subeventData[subeventKey].noResponse++;
            }
          }
        });
      }
    });

    // Find most popular subevent (highest invitation count)
    const availableSubevents = Object.values(subeventData);
    const mostPopularSubevent = availableSubevents.reduce(
      (max, current) =>
        current.totalInvited > (max?.totalInvited || 0) ? current : max,
      null,
    );

    // Use selectedSubevent or default to most popular
    const currentSubevent = selectedSubevent
      ? subeventData[selectedSubevent]
      : mostPopularSubevent;

    // Calculate metrics for selected subevent
    const totalInvited = currentSubevent?.totalInvited || 0;
    const subeventAttending = currentSubevent?.totalAttendeeCount || 0;
    const totalResponses = currentSubevent
      ? currentSubevent.attending +
      currentSubevent.notAttending +
      currentSubevent.maybe
      : 0;
    const pendingResponses = totalInvited - totalResponses;
    const estimatedTables = Math.ceil(subeventAttending / tablesPerGuest);

    // Gender breakdown for selected subevent attendees
    const genderBreakdown = guestList.reduce(
      (acc, guest) => {
        // Only count guests attending the selected subevent
        if (currentSubevent && guest.rsvp_status) {
          const subeventRsvp = Object.values(guest.rsvp_status).find(
            (rsvp) => rsvp.subevent_id === currentSubevent.id,
          );

          // Only include if guest is attending (status_id 3) or maybe (status_id 5)
          if (subeventRsvp && [3, 5].includes(subeventRsvp.status_id)) {
            const gender = guest.gender?.toLowerCase();
            console.log(Date.UTC(), "ANALYTICS", "GUEST GENDER", guest, gender);
            if (gender === "male") acc.male++;
            else if (gender === "female") acc.female++;
            else if (
              guest.guest_age_group?.state?.toLowerCase().includes("child")
            )
              acc.children++;
            else acc.other++;
          }
        }
        return acc;
      },
      { male: 0, female: 0, other: 0, children: 0 },
    );

    // RSVP status breakdown for selected subevent
    const rsvpStatusBreakdown = currentSubevent
      ? {
        attending: currentSubevent.attending,
        notAttending: currentSubevent.notAttending,
        maybe: currentSubevent.maybe,
        noResponse: currentSubevent.noResponse,
      }
      : { attending: 0, notAttending: 0, maybe: 0, noResponse: 0 };

    return {
      totalGuests,
      totalInvited,
      subeventAttending,
      pendingResponses,
      estimatedTables,
      genderBreakdown,
      subeventData,
      availableSubevents,
      mostPopularSubevent,
      currentSubevent,
      rsvpStatusBreakdown,
    };
  }, [guestList, tablesPerGuest, selectedSubevent]);

  // Set default subevent to most popular when data loads
  React.useEffect(() => {
    if (analyticsData.mostPopularSubevent && selectedSubevent === null) {
      setSelectedSubevent(analyticsData.mostPopularSubevent.id.toString());
    }
  }, [analyticsData.mostPopularSubevent, selectedSubevent]);

  const handleTablesPerGuestChange = (e) => {
    const value = parseInt(e.target.value) || 8;
    setTablesPerGuest(value);
  };

  const handleSubeventChange = (e) => {
    setSelectedSubevent(e.target.value);
  };

  const renderGenderChart = () => {
    const { genderBreakdown } = analyticsData;
    const total = Object.values(genderBreakdown).reduce(
      (sum, count) => sum + count,
      0,
    );

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
        gradientStops.push(
          `#3b82f6 ${currentAngle}deg ${currentAngle + maleAngle}deg`,
        );
        currentAngle += maleAngle;
      }

      if (female > 0) {
        const femaleAngle = (female / total) * 360;
        gradientStops.push(
          `#ec4899 ${currentAngle}deg ${currentAngle + femaleAngle}deg`,
        );
        currentAngle += femaleAngle;
      }

      if (children > 0) {
        const childrenAngle = (children / total) * 360;
        gradientStops.push(
          `#eab308 ${currentAngle}deg ${currentAngle + childrenAngle}deg`,
        );
        currentAngle += childrenAngle;
      }

      if (other > 0) {
        const otherAngle = (other / total) * 360;
        gradientStops.push(
          `#8b5cf6 ${currentAngle}deg ${currentAngle + otherAngle}deg`,
        );
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
              genderBreakdown.other,
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

    const maxValue = Math.max(...data.map((item) => item.totalAttendeeCount));

    return (
      <div
        style={{
          height: "300px",
          display: "flex",
          alignItems: "end",
          gap: "24px",
          padding: "16px 0",
        }}
      >
        {data.map((item, index) => {
          const height =
            maxValue > 0 ? (item.totalAttendeeCount / maxValue) * 100 : 0;
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
                  background:
                    "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
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
                  {item.totalAttendeeCount}
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
        <h1
          style={{
            fontSize: "56px",
            fontWeight: 800,
            color: "#581c87",
            marginBottom: "24px",
            letterSpacing: "-2px",
          }}
        >
          Event Analytics
        </h1>
        <p
          style={{
            fontSize: "20px",
            color: "#4b5563",
            marginBottom: "32px",
          }}
        >
          Comprehensive insights and planning tools for{" "}
          {event?.eventTitle || "your event"}
        </p>

        {/* Subevent Selector */}
        {analyticsData.availableSubevents.length > 0 && (
          <div
            style={{
              textAlign: "center",
              marginBottom: "32px",
            }}
          >
            <label
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "#374151",
                marginRight: "16px",
              }}
            >
              Analyzing:
            </label>
            <select
              value={selectedSubevent || ""}
              onChange={handleSubeventChange}
              style={{
                padding: "12px 20px",
                border: "2px solid #7c3aed",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: 600,
                background: "white",
                color: "#581c87",
                cursor: "pointer",
                minWidth: "200px",
              }}
            >
              {analyticsData.availableSubevents.map((subevent) => (
                <option key={subevent.id} value={subevent.id.toString()}>
                  {subevent.title} ({subevent.totalInvited} invited)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Overview Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "32px",
          marginBottom: "64px",
        }}
      >
        <div
          style={{
            background: "white",
            border: "2px solid #e5e7eb",
            borderRadius: "24px",
            padding: "48px",
            textAlign: "center",
            transition: "all 0.3s ease",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              content: "",
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "4px",
              background: "linear-gradient(135deg, #7c3aed 0%, #581c87 100%)",
            }}
          />
          <div
            style={{
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
            }}
          >
            👥
          </div>
          <div
            style={{
              fontSize: "32px",
              fontWeight: 800,
              color: "#111827",
              marginBottom: "8px",
            }}
          >
            {analyticsData.totalInvited}
          </div>
          <div
            style={{
              color: "#4b5563",
              fontSize: "16px",
              fontWeight: 600,
            }}
          >
            Total Invited
          </div>
          <div
            style={{
              fontSize: "14px",
              marginTop: "8px",
              fontWeight: 500,
              color: "#7c3aed",
            }}
          >
            to {analyticsData.currentSubevent?.title || "selected event"}
          </div>
        </div>

        <div
          style={{
            background: "white",
            border: "2px solid #e5e7eb",
            borderRadius: "24px",
            padding: "48px",
            textAlign: "center",
            transition: "all 0.3s ease",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              content: "",
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "4px",
              background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
            }}
          />
          <div
            style={{
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
            }}
          >
            ✅
          </div>
          <div
            style={{
              fontSize: "32px",
              fontWeight: 800,
              color: "#111827",
              marginBottom: "8px",
            }}
          >
            {analyticsData.subeventAttending}
          </div>
          <div
            style={{
              color: "#4b5563",
              fontSize: "16px",
              fontWeight: 600,
            }}
          >
            Attending {analyticsData.currentSubevent?.title || "Event"}
          </div>
          <div
            style={{
              fontSize: "14px",
              marginTop: "8px",
              fontWeight: 500,
              color: "#10b981",
            }}
          >
            {analyticsData.totalInvited > 0
              ? (
                (analyticsData.subeventAttending /
                  analyticsData.totalInvited) *
                100
              ).toFixed(1)
              : 0}
            % attendance rate
          </div>
        </div>

        <div
          style={{
            background: "white",
            border: "2px solid #e5e7eb",
            borderRadius: "24px",
            padding: "48px",
            textAlign: "center",
            transition: "all 0.3s ease",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              content: "",
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "4px",
              background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
            }}
          />
          <div
            style={{
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
            }}
          >
            ⏳
          </div>
          <div
            style={{
              fontSize: "32px",
              fontWeight: 800,
              color: "#111827",
              marginBottom: "8px",
            }}
          >
            {analyticsData.pendingResponses}
          </div>
          <div
            style={{
              color: "#4b5563",
              fontSize: "16px",
              fontWeight: 600,
            }}
          >
            Pending Responses
          </div>
          <div
            style={{
              fontSize: "14px",
              marginTop: "8px",
              fontWeight: 500,
              color: "#f59e0b",
            }}
          >
            Need follow-up
          </div>
        </div>

        <div
          style={{
            background: "white",
            border: "2px solid #e5e7eb",
            borderRadius: "24px",
            padding: "48px",
            textAlign: "center",
            transition: "all 0.3s ease",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              content: "",
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "4px",
              background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
            }}
          />
          <div
            style={{
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
            }}
          >
            🍽️
          </div>
          <div
            style={{
              fontSize: "32px",
              fontWeight: 800,
              color: "#111827",
              marginBottom: "8px",
            }}
          >
            {analyticsData.estimatedTables}
          </div>
          <div
            style={{
              color: "#4b5563",
              fontSize: "16px",
              fontWeight: 600,
            }}
          >
            Estimated Tables
          </div>
          <div
            style={{
              fontSize: "14px",
              marginTop: "8px",
              fontWeight: 500,
              color: "#10b981",
            }}
          >
            Based on {tablesPerGuest} per table
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "48px",
          marginBottom: "64px",
        }}
      >
        {/* Gender Breakdown */}
        <div
          style={{
            background: "white",
            border: "2px solid #e5e7eb",
            borderRadius: "24px",
            padding: "48px",
            boxShadow: "0 10px 15px rgba(0, 0, 0, 0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "48px",
              paddingBottom: "32px",
              borderBottom: "2px solid #f3f4f6",
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: "24px",
                  fontWeight: 700,
                  color: "#111827",
                  margin: 0,
                }}
              >
                Gender Distribution
              </h3>
              <p
                style={{
                  fontSize: "14px",
                  color: "#6b7280",
                  marginTop: "8px",
                  margin: 0,
                }}
              >
                Breakdown of attendees by gender for{" "}
                {analyticsData.currentSubevent?.title || "selected event"}
              </p>
            </div>
          </div>
          {renderGenderChart()}
        </div>

        {/* Response Timeline */}
        <div
          style={{
            background: "white",
            border: "2px solid #e5e7eb",
            borderRadius: "24px",
            padding: "48px",
            boxShadow: "0 10px 15px rgba(0, 0, 0, 0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "48px",
              paddingBottom: "32px",
              borderBottom: "2px solid #f3f4f6",
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: "24px",
                  fontWeight: 700,
                  color: "#111827",
                  margin: 0,
                }}
              >
                Subevent Attendance
              </h3>
              <p
                style={{
                  fontSize: "14px",
                  color: "#6b7280",
                  marginTop: "8px",
                  margin: 0,
                }}
              >
                Confirmed attendance per subevent
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
            >
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
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
            gap: "48px",
          }}
        >
          {/* Table Planning */}
          <div
            style={{
              background: "white",
              border: "2px solid #e5e7eb",
              borderRadius: "24px",
              padding: "48px",
              boxShadow: "0 10px 15px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "24px",
                marginBottom: "32px",
              }}
            >
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  background: "#7c3aed",
                  color: "white",
                }}
              >
                🪑
              </div>
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#111827",
                  margin: 0,
                }}
              >
                Table Planning
              </h3>
            </div>

            {/* Settings Panel */}
            <div
              style={{
                background: "#eff6ff",
                border: "2px solid #bfdbfe",
                borderRadius: "16px",
                padding: "32px",
                marginBottom: "32px",
              }}
            >
              <h4
                style={{
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "#2563eb",
                  marginBottom: "24px",
                  margin: "0 0 24px 0",
                }}
              >
                Configuration
              </h4>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "24px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <label
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
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
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "24px",
                  background: "#f9fafb",
                  borderRadius: "12px",
                  marginBottom: "8px",
                }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    color: "#6b7280",
                  }}
                >
                  Attending {analyticsData.currentSubevent?.title || "event"}
                </span>
                <span
                  style={{
                    fontWeight: 700,
                    color: "#111827",
                  }}
                >
                  {analyticsData.subeventAttending}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "24px",
                  background: "#f9fafb",
                  borderRadius: "12px",
                  marginBottom: "8px",
                }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    color: "#6b7280",
                  }}
                >
                  Guests per table
                </span>
                <span
                  style={{
                    fontWeight: 700,
                    color: "#111827",
                  }}
                >
                  {tablesPerGuest}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "24px",
                  background: "#7c3aed",
                  color: "white",
                  borderRadius: "12px",
                  fontWeight: 700,
                }}
              >
                <span>Total tables needed</span>
                <span>{analyticsData.estimatedTables}</span>
              </div>
            </div>
          </div>

          {/* RSVP Breakdown */}
          <div
            style={{
              background: "white",
              border: "2px solid #e5e7eb",
              borderRadius: "24px",
              padding: "48px",
              boxShadow: "0 10px 15px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "24px",
                marginBottom: "32px",
              }}
            >
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  background: "#7c3aed",
                  color: "white",
                }}
              >
                📊
              </div>
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#111827",
                  margin: 0,
                }}
              >
                RSVP Breakdown
              </h3>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "32px",
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  padding: "32px",
                  background: "#f9fafb",
                  borderRadius: "16px",
                  border: "2px solid #e5e7eb",
                  transition: "all 0.3s ease",
                }}
              >
                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: 800,
                    color: "#10b981",
                    marginBottom: "8px",
                  }}
                >
                  {analyticsData.rsvpStatusBreakdown.attending}
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "#6b7280",
                    fontWeight: 600,
                  }}
                >
                  Attending
                </div>
              </div>

              <div
                style={{
                  textAlign: "center",
                  padding: "32px",
                  background: "#f9fafb",
                  borderRadius: "16px",
                  border: "2px solid #e5e7eb",
                  transition: "all 0.3s ease",
                }}
              >
                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: 800,
                    color: "#ef4444",
                    marginBottom: "8px",
                  }}
                >
                  {analyticsData.rsvpStatusBreakdown.notAttending}
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "#6b7280",
                    fontWeight: 600,
                  }}
                >
                  Not Attending
                </div>
              </div>

              <div
                style={{
                  textAlign: "center",
                  padding: "32px",
                  background: "#f9fafb",
                  borderRadius: "16px",
                  border: "2px solid #e5e7eb",
                  transition: "all 0.3s ease",
                }}
              >
                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: 800,
                    color: "#f59e0b",
                    marginBottom: "8px",
                  }}
                >
                  {analyticsData.rsvpStatusBreakdown.maybe}
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "#6b7280",
                    fontWeight: 600,
                  }}
                >
                  Maybe
                </div>
              </div>

              <div
                style={{
                  textAlign: "center",
                  padding: "32px",
                  background: "#f9fafb",
                  borderRadius: "16px",
                  border: "2px solid #e5e7eb",
                  transition: "all 0.3s ease",
                }}
              >
                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: 800,
                    color: "#6b7280",
                    marginBottom: "8px",
                  }}
                >
                  {analyticsData.rsvpStatusBreakdown.noResponse}
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "#6b7280",
                    fontWeight: 600,
                  }}
                >
                  No Response
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div style={{ marginBottom: "64px" }}>
        <div
          style={{
            background: "white",
            border: "2px solid #e5e7eb",
            borderRadius: "24px",
            padding: "48px",
            boxShadow: "0 10px 15px rgba(0, 0, 0, 0.1)",
          }}
        >
          <h3
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "#581c87",
              marginBottom: "32px",
            }}
          >
            Subevent Analysis
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "32px",
            }}
          >
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
                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: 800,
                    color: "#581c87",
                    marginBottom: "8px",
                  }}
                >
                  {data.totalAttendeeCount}
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "#6b7280",
                    fontWeight: 600,
                    marginBottom: "4px",
                  }}
                >
                  {data.title}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#10b981",
                    fontWeight: 500,
                  }}
                >
                  {data.totalInvited > 0
                    ? (
                      ((data.attending + data.notAttending + data.maybe) /
                        data.totalInvited) *
                      100
                    ).toFixed(1)
                    : 0}
                  % response rate
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
