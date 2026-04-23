import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `You are an elite Indian stock market trading bot specializing in NSE/BSE markets. You analyze stocks using:
- Price action & candlestick patterns
- Volume analysis
- Moving averages (20, 50, 200 EMA)
- RSI (14), MACD, Bollinger Bands
- Breakout patterns (cup & handle, bull flags, ascending triangles)
- News sentiment & sector momentum

STRICT TRADING RULES:
1. Only recommend trades in uptrend (price above 50 EMA)
2. Confirm breakouts with 1.5x+ average volume
3. RSI must be between 50–70 (not overbought)
4. Minimum Risk:Reward ratio of 1:2
5. Max risk per trade: 2% of capital
6. Avoid sideways/range-bound markets
7. Only high-probability setups (implied win rate >70%)

For every trade setup, provide EXACTLY this format using markdown table:

## 🎯 Trade Setups — [Date/Context]

| Field | Details |
|-------|---------|
| 📌 Stock | Name (NSE: TICKER) |
| 💰 Entry Zone | ₹XXX – ₹XXX |
| 🛑 Stop Loss | ₹XXX (X% below entry) |
| 🎯 Target 1 | ₹XXX (X% gain) |
| 🎯 Target 2 | ₹XXX (X% gain) |
| ⚖️ Risk:Reward | 1:X |
| ⚡ Risk Level | Low / Medium / High |
| 📊 Trade Type | Intraday / Swing (X days) |
| 📈 Setup | Brief pattern name |
| 📝 Reason | 2-3 sentences explaining the technical setup |

Separate multiple stocks with a horizontal rule.

After all setups, add:
## ⚠️ Risk Management
- Brief notes on position sizing and key risk factors

## 🌐 Market Context
- Brief overview of current market/sector sentiment

Always add disclaimer: "⚠️ This is AI-generated analysis for educational purposes only. Verify all prices live on NSE/TradingView before trading. Not SEBI-registered advice."

If asked general questions, answer concisely as a market expert. If asked for specific stock analysis, provide the full table format above. Use current knowledge of Indian market stocks like Reliance, TCS, Infosys, HDFC Bank, ICICI Bank, BEL, HAL, Dixon, Zomato, Nykaa, etc.`;

const WEB_SEARCH_TOOL = {
  type: "web_search_20250305",
  name: "web_search",
};

function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: "5px", alignItems: "center", padding: "8px 0" }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "#00ff88",
            animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function parseMarkdown(text) {
  // Convert markdown to styled HTML-like React elements
  const lines = text.split("\n");
  const elements = [];
  let inTable = false;
  let tableRows = [];
  let key = 0;

  const flushTable = () => {
    if (tableRows.length > 0) {
      elements.push(
        <div key={key++} style={{ overflowX: "auto", margin: "12px 0" }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "13px",
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            <tbody>
              {tableRows.map((row, ri) => {
                const cells = row.split("|").filter(c => c.trim() !== "");
                if (cells.every(c => /^[-\s:]+$/.test(c))) return null;
                return (
                  <tr key={ri} style={{
                    background: ri === 0 ? "rgba(0,255,136,0.08)" : ri % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
                    borderBottom: "1px solid rgba(0,255,136,0.1)",
                  }}>
                    {cells.map((cell, ci) => {
                      const Tag = ri === 0 ? "th" : "td";
                      return (
                        <Tag key={ci} style={{
                          padding: "7px 12px",
                          textAlign: "left",
                          color: ri === 0 ? "#00ff88" : ci === 1 ? "#e2e8f0" : "#a0aec0",
                          fontWeight: ri === 0 ? "700" : ci === 0 ? "600" : "400",
                          whiteSpace: ci === 0 ? "nowrap" : "normal",
                          borderRight: "1px solid rgba(0,255,136,0.05)",
                        }}>
                          {cell.trim()}
                        </Tag>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
    }
    inTable = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("|")) {
      inTable = true;
      tableRows.push(line);
      continue;
    }

    if (inTable) flushTable();

    if (line.startsWith("## ")) {
      elements.push(
        <div key={key++} style={{
          fontSize: "15px",
          fontWeight: "700",
          color: "#00ff88",
          margin: "18px 0 8px",
          paddingBottom: "4px",
          borderBottom: "1px solid rgba(0,255,136,0.2)",
          fontFamily: "'Space Grotesk', sans-serif",
          letterSpacing: "0.02em",
        }}>
          {line.replace("## ", "")}
        </div>
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <div key={key++} style={{ fontSize: "14px", fontWeight: "600", color: "#ffd700", margin: "12px 0 4px" }}>
          {line.replace("### ", "")}
        </div>
      );
    } else if (line.startsWith("---")) {
      elements.push(<hr key={key++} style={{ border: "none", borderTop: "1px solid rgba(0,255,136,0.15)", margin: "16px 0" }} />);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <div key={key++} style={{ display: "flex", gap: "8px", margin: "3px 0", color: "#cbd5e0", fontSize: "13px" }}>
          <span style={{ color: "#00ff88", flexShrink: 0 }}>▸</span>
          <span>{line.replace(/^[-*] /, "")}</span>
        </div>
      );
    } else if (line.startsWith("⚠️")) {
      elements.push(
        <div key={key++} style={{
          background: "rgba(255, 165, 0, 0.08)",
          border: "1px solid rgba(255,165,0,0.25)",
          borderRadius: "6px",
          padding: "10px 14px",
          margin: "12px 0",
          color: "#ffa500",
          fontSize: "12px",
          lineHeight: "1.6",
        }}>
          {line}
        </div>
      );
    } else if (line.trim() !== "") {
      // Handle inline bold
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      elements.push(
        <p key={key++} style={{ margin: "4px 0", color: "#cbd5e0", fontSize: "13.5px", lineHeight: "1.7" }}>
          {parts.map((part, pi) =>
            part.startsWith("**") && part.endsWith("**")
              ? <strong key={pi} style={{ color: "#e2e8f0", fontWeight: "600" }}>{part.slice(2, -2)}</strong>
              : part
          )}
        </p>
      );
    }
  }

  if (inTable) flushTable();

  return elements;
}

const QUICK_PROMPTS = [
  "🔍 Scan top NSE breakout stocks today",
  "📊 Intraday picks for Nifty 50 stocks",
  "🛡️ Best defence sector swing trades",
  "💊 Top pharma stocks to buy now",
  "🏦 HDFC Bank technical analysis",
  "⚡ High momentum midcap stocks",
];

export default function TradingBot() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `## 🤖 NSE/BSE Trading Bot Online

Welcome, Trader. I'm your AI-powered Indian stock market analyst.

**I can help you with:**
- 📊 Technical analysis & trade setups (NSE/BSE)
- 🎯 Intraday & swing trading opportunities
- 📈 Breakout stock scanning
- ⚖️ Risk management calculations
- 🌐 Sector rotation & market outlook

**Quick start:** Click a prompt below or type your query.

⚠️ Always verify prices live before trading. Not SEBI-registered advice.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;

    setInput("");
    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const apiMessages = newMessages
        .filter((m) => m.role !== "assistant" || m.content !== messages[0]?.content)
        .map((m) => ({ role: m.role, content: m.content }));

      // Keep last 10 messages for context
      const trimmed = apiMessages.slice(-10);

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          tools: [WEB_SEARCH_TOOL],
          messages: trimmed,
        }),
      });

      const data = await response.json();

      // Extract text from response (may include tool use blocks)
      const textContent = data.content
        ?.filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n") || "Sorry, I couldn't generate a response. Please try again.";

      setMessages((prev) => [...prev, { role: "assistant", content: textContent }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Connection error. Please check your network and try again." },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body { background: #050a0f; }

        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes scanline {
          0% { top: -5%; }
          100% { top: 105%; }
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        .msg-bubble {
          animation: fadeSlideUp 0.3s ease forwards;
        }

        .send-btn:hover {
          background: #00ff88 !important;
          color: #050a0f !important;
        }

        .quick-btn:hover {
          background: rgba(0,255,136,0.12) !important;
          border-color: rgba(0,255,136,0.5) !important;
          color: #00ff88 !important;
        }

        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #0a0f14; }
        ::-webkit-scrollbar-thumb { background: #1a2a1a; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #00ff88; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "#050a0f",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Space Grotesk', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Background grid */}
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(0,255,136,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,136,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          pointerEvents: "none",
          zIndex: 0,
        }} />

        {/* Header */}
        <div style={{
          background: "rgba(5,10,15,0.95)",
          borderBottom: "1px solid rgba(0,255,136,0.2)",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 100,
          backdropFilter: "blur(10px)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "36px",
              height: "36px",
              background: "linear-gradient(135deg, #00ff88, #00cc6a)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              boxShadow: "0 0 20px rgba(0,255,136,0.3)",
            }}>📈</div>
            <div>
              <div style={{ fontSize: "15px", fontWeight: "700", color: "#00ff88", letterSpacing: "0.05em" }}>
                NSE/BSE TRADING BOT
              </div>
              <div style={{ fontSize: "11px", color: "#4a6a4a", fontFamily: "'JetBrains Mono', monospace" }}>
                AI-POWERED • TECHNICAL ANALYSIS
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#00ff88", boxShadow: "0 0 8px #00ff88", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: "11px", color: "#00ff88", fontFamily: "'JetBrains Mono', monospace" }}>LIVE</span>
          </div>
        </div>

        {/* Chat area */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          zIndex: 1,
          maxWidth: "860px",
          width: "100%",
          margin: "0 auto",
        }}>
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className="msg-bubble"
              style={{
                display: "flex",
                flexDirection: msg.role === "user" ? "row-reverse" : "row",
                gap: "10px",
                alignItems: "flex-start",
              }}
            >
              {/* Avatar */}
              <div style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
                background: msg.role === "user"
                  ? "rgba(0,255,136,0.15)"
                  : "rgba(0,255,136,0.08)",
                border: `1px solid ${msg.role === "user" ? "rgba(0,255,136,0.3)" : "rgba(0,255,136,0.15)"}`,
              }}>
                {msg.role === "user" ? "👤" : "🤖"}
              </div>

              {/* Bubble */}
              <div style={{
                maxWidth: "85%",
                background: msg.role === "user"
                  ? "rgba(0,255,136,0.08)"
                  : "rgba(10,20,15,0.8)",
                border: `1px solid ${msg.role === "user" ? "rgba(0,255,136,0.25)" : "rgba(0,255,136,0.1)"}`,
                borderRadius: msg.role === "user" ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                padding: "14px 16px",
                backdropFilter: "blur(10px)",
              }}>
                {msg.role === "user" ? (
                  <p style={{ color: "#e2e8f0", fontSize: "13.5px", lineHeight: "1.6" }}>{msg.content}</p>
                ) : (
                  <div>{parseMarkdown(msg.content)}</div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <div style={{
                width: "32px", height: "32px", borderRadius: "8px",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "16px", background: "rgba(0,255,136,0.08)",
                border: "1px solid rgba(0,255,136,0.15)",
              }}>🤖</div>
              <div style={{
                background: "rgba(10,20,15,0.8)",
                border: "1px solid rgba(0,255,136,0.1)",
                borderRadius: "4px 16px 16px 16px",
                padding: "12px 16px",
              }}>
                <div style={{ fontSize: "11px", color: "#4a6a4a", marginBottom: "6px", fontFamily: "'JetBrains Mono', monospace" }}>
                  SCANNING MARKETS...
                </div>
                <TypingIndicator />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick prompts */}
        {messages.length <= 1 && (
          <div style={{
            padding: "0 16px 12px",
            maxWidth: "860px",
            width: "100%",
            margin: "0 auto",
            zIndex: 1,
          }}>
            <div style={{
              fontSize: "11px",
              color: "#4a6a4a",
              marginBottom: "8px",
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "0.08em",
            }}>
              QUICK COMMANDS:
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {QUICK_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  className="quick-btn"
                  onClick={() => sendMessage(p)}
                  style={{
                    background: "rgba(0,255,136,0.05)",
                    border: "1px solid rgba(0,255,136,0.2)",
                    borderRadius: "20px",
                    padding: "6px 14px",
                    color: "#a0c0a0",
                    fontSize: "12px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input area */}
        <div style={{
          borderTop: "1px solid rgba(0,255,136,0.15)",
          background: "rgba(5,10,15,0.95)",
          backdropFilter: "blur(10px)",
          padding: "14px 16px",
          zIndex: 100,
        }}>
          <div style={{
            maxWidth: "860px",
            margin: "0 auto",
            display: "flex",
            gap: "10px",
            alignItems: "flex-end",
          }}>
            <div style={{
              flex: 1,
              background: "rgba(10,20,15,0.8)",
              border: "1px solid rgba(0,255,136,0.2)",
              borderRadius: "12px",
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}>
              <span style={{ color: "#00ff88", fontFamily: "'JetBrains Mono', monospace", fontSize: "14px" }}>›</span>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask about any NSE/BSE stock or market analysis..."
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#e2e8f0",
                  fontSize: "13.5px",
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              />
            </div>
            <button
              className="send-btn"
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              style={{
                background: loading || !input.trim() ? "rgba(0,255,136,0.1)" : "rgba(0,255,136,0.15)",
                border: "1px solid rgba(0,255,136,0.3)",
                borderRadius: "12px",
                width: "44px",
                height: "44px",
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                transition: "all 0.2s ease",
                flexShrink: 0,
                color: "#00ff88",
              }}
            >
              {loading ? "⏳" : "⚡"}
            </button>
          </div>
          <div style={{
            textAlign: "center",
            fontSize: "10px",
            color: "#2a3a2a",
            marginTop: "8px",
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            NOT SEBI REGISTERED ADVICE • FOR EDUCATIONAL PURPOSES ONLY
          </div>
        </div>
      </div>
    </>
  );
}
