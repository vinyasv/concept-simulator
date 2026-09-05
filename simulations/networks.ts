import { Lesson, Frame, num, choice, frame, modPow } from "./model";
export const networkLessons: Record<string, Lesson> = {
  cs_packet_switching: {
    assumptions:
      "Two store-and-forward links, one packet per link per tick. Each packet crosses both links; selected first-link packet is dropped once. No retransmission in this lesson.",
    columns: ["Packet", "Location"],
    parameters: [
      num("n", "Packet count", 5, 2, 8),
      num("drop", "Drop packet (0 = none)", 0, 0, 8),
    ],
    run: (p) => {
      const n = Number(p.n),
        state = Array.from({ length: n }, () => "Source"),
        out: Frame[] = [];
      for (let tick = 0; tick < n + 2; tick++) {
        for (let i = 0; i < n; i++) {
          if (i + 2 === tick && state[i] === "Router") state[i] = "Delivered";
          if (i + 1 === tick && state[i] === "Link 1")
            state[i] = i + 1 === Number(p.drop) ? "Dropped" : "Router";
          if (i === tick) state[i] = "Link 1";
        }
        out.push(
          frame(
            `Tick ${tick}: packets progress independently through the two-hop route.`,
            state.map((s, i) => [i + 1, s]),
            {
              Delivered: state.filter((s) => s === "Delivered").length,
              Dropped: state.filter((s) => s === "Dropped").length,
            },
          ),
        );
      }
      return out;
    },
  },
  cs_tcp_congestion: {
    assumptions:
      "Simplified TCP Tahoe: begin cwnd=1, slow-start threshold=8. ACK rounds double cwnd below threshold, then add one. A timeout sets threshold to half the window and cwnd to 1. No fast recovery.",
    columns: ["RTT", "Window (segments)", "Threshold", "Mode"],
    parameters: [num("loss", "Timeout at RTT", 6, 2, 10)],
    run: (p) => {
      let cwnd = 1,
        threshold = 8;
      const rows: Frame["rows"] = [[0, 1, 8, "Slow start"]],
        out = [frame("Start with one segment in flight.", [...rows])];
      for (let t = 1; t <= 12; t++) {
        const loss = t === Number(p.loss);
        if (loss) {
          threshold = Math.max(2, Math.floor(cwnd / 2));
          cwnd = 1;
        } else cwnd = cwnd < threshold ? cwnd * 2 : cwnd + 1;
        rows.push([
          t,
          cwnd,
          threshold,
          loss ? "Timeout" : cwnd < threshold ? "Slow start" : "Avoidance",
        ]);
        out.push({
          ...frame(
            loss
              ? "Timeout: reduce the threshold and restart slow start."
              : "An ACK round allows the congestion window to grow.",
            [...rows],
            { Window: cwnd },
          ),
          values: rows.map((r) => Number(r[1])),
        });
      }
      return out;
    },
  },
  cs_dns_resolution: {
    assumptions:
      "Illustrative recursive lookup for www.example.test. Fixed latency per request; .test is reserved. Cached answers skip hierarchy lookup; real systems also use TTLs and negative caching.",
    columns: ["Request", "Answer", "Elapsed ms"],
    parameters: [
      choice("cache", "Resolver cache", ["Empty", "Hit"]),
      num("latency", "Per-request latency (ms)", 20, 5, 100, 5),
    ],
    run: (p) => {
      const l = Number(p.latency),
        rows: Frame["rows"] = [],
        out: Frame[] = [];
      const steps =
        p.cache === "Hit"
          ? [["Client → resolver", "Cached A record: 192.0.2.10"]]
          : [
              ["Client → resolver", "Cache miss"],
              ["Resolver → root", "Referral to .test server"],
              ["Resolver → .test", "Referral to example.test authority"],
              ["Resolver → authority", "A record: 192.0.2.10"],
              ["Resolver → client", "Return and cache the answer"],
            ];
      steps.forEach(([a, b], i) => {
        rows.push([a, b, (i + 1) * l]);
        out.push(frame(b, [...rows], { "Elapsed ms": (i + 1) * l }));
      });
      return out;
    },
  },
  cs_load_balancing: {
    assumptions:
      "Nine requests arrive one per tick. Servers take 2, 4, and 6 ticks respectively. Completions release connections before the next assignment. Ties choose the lowest server index.",
    columns: ["Server", "Active requests", "Total assigned"],
    parameters: [
      choice("policy", "Routing policy", ["Round robin", "Least connections"]),
      choice("health", "Server 3", ["Healthy", "Offline"]),
    ],
    run: (p) => {
      const active: number[][] = [[], [], []],
        assigned = [0, 0, 0],
        out: Frame[] = [];
      for (let t = 0; t < 9; t++) {
        active.forEach((a, i) => (active[i] = a.filter((end) => end > t)));
        const available = p.health === "Healthy" ? [0, 1, 2] : [0, 1];
        const server =
          p.policy === "Round robin"
            ? available[t % available.length]
            : available.reduce((a, b) =>
                active[a].length <= active[b].length ? a : b,
              );
        active[server].push(t + [2, 4, 6][server]);
        assigned[server]++;
        out.push(
          frame(
            `At tick ${t}, send request ${t + 1} to server ${server + 1}.`,
            active.map((a, i) => [
              i + 1,
              i === 2 && p.health === "Offline" ? "Offline" : a.length,
              assigned[i],
            ]),
          ),
        );
      }
      return out;
    },
  },
  cs_raft_consensus: {
    assumptions:
      "A single election and one new log entry in a five-node cluster with initially up-to-date logs. Reachable peers vote once in term 1. Quorum is 3; this bounded scenario omits competing candidates and log conflict repair.",
    columns: ["Node", "Role", "Log entry", "Committed"],
    parameters: [
      num("reachable", "Nodes reachable including candidate", 3, 1, 5),
    ],
    run: (p) => {
      const n = Number(p.reachable),
        out: Frame[] = [];
      const rows = (stage: number) =>
        Array.from({ length: 5 }, (_, i) => [
          i + 1,
          i >= n
            ? "Partitioned"
            : i === 0
              ? stage >= 1 && n >= 3
                ? "Leader"
                : "Candidate"
              : "Follower",
          stage >= 2 && i < n ? "set x=1" : "Empty",
          stage >= 3 && i < n ? "Yes" : "No",
        ]);
      out.push(
        frame("Node 1 starts term 1 and requests votes.", rows(0), {
          Quorum: 3,
        }),
      );
      out.push(
        frame(
          `${n} votes: ${n >= 3 ? "majority elects node 1" : "no majority, so no leader can commit"}.`,
          rows(1),
          { Votes: n },
        ),
      );
      if (n >= 3) {
        out.push(
          frame(
            "Leader replicates the current-term entry to reachable followers.",
            rows(2),
          ),
        );
        out.push(
          frame(
            "A majority acknowledges the entry. The leader commits and announces the commit.",
            rows(3),
          ),
        );
      }
      return out;
    },
  },
  cs_diffie_hellman: {
    assumptions:
      "Toy finite-field exchange: public prime p=23 and generator g=5. Tiny parameters illustrate arithmetic only and provide no practical secrecy.",
    columns: ["Quantity", "Value", "Visibility"],
    parameters: [
      num("a", "Alice private exponent", 6, 1, 21),
      num("b", "Bob private exponent", 15, 1, 21),
    ],
    run: (p) => {
      const a = Number(p.a),
        b = Number(p.b),
        A = modPow(5, a, 23),
        B = modPow(5, b, 23);
      return [
        frame("Choose private exponents; p and g are public.", [
          ["p", 23, "Public"],
          ["g", 5, "Public"],
          ["a", a, "Alice only"],
          ["b", b, "Bob only"],
        ]),
        frame("Exchange public powers, not the private exponents.", [
          ["A = g^a mod p", A, "Public"],
          ["B = g^b mod p", B, "Public"],
        ]),
        frame(
          "Both computations equal g^(ab) mod p.",
          [
            ["Alice: B^a mod p", modPow(B, a, 23), "Private"],
            ["Bob: A^b mod p", modPow(A, b, 23), "Private"],
          ],
          { Match: modPow(B, a, 23) === modPow(A, b, 23) ? "Yes" : "No" },
        ),
      ];
    },
  },
  cs_hashing_signatures: {
    assumptions:
      "Educational fingerprint h(m)=(31m+7) mod 3233 and textbook RSA (e=17,d=2753,n=3233). Neither this fingerprint nor unpadded toy RSA is suitable for real signatures; collisions exist.",
    columns: ["Quantity", "Value"],
    parameters: [
      num("message", "Message integer", 42, 0, 100),
      choice("tamper", "Received message", ["Original", "Changed (+1)"]),
    ],
    run: (p) => {
      const m = Number(p.message),
        h = (31 * m + 7) % 3233,
        s = modPow(h, 2753, 3233),
        received = m + (p.tamper === "Original" ? 0 : 1),
        rh = (31 * received + 7) % 3233,
        verified = modPow(s, 17, 3233);
      return [
        frame("Fingerprint the original message.", [
          ["Message", m],
          ["Fingerprint", h],
        ]),
        frame("Apply the private exponent to the fingerprint.", [
          ["Signature", s],
        ]),
        frame(
          "Recover the signed fingerprint with the public exponent and compare it with the received message fingerprint.",
          [
            ["Received message", received],
            ["Received fingerprint", rh],
            ["Signed fingerprint", verified],
          ],
          { Verification: rh === verified ? "Matches" : "Mismatch" },
        ),
      ];
    },
  },
  cs_symmetric_public_crypto: {
    assumptions:
      "Compare toy XOR with a shared byte key and textbook RSA with n=3233,e=17,d=2753. This illustrates key roles and round trips, not secure encryption or padding.",
    columns: ["Stage", "Value", "Key used"],
    parameters: [
      num("message", "Message byte", 42, 0, 255),
      choice("method", "Method", ["Shared-key XOR", "Public-key RSA"]),
    ],
    run: (p) => {
      const m = Number(p.message),
        rsa = p.method === "Public-key RSA",
        cipher = rsa ? modPow(m, 17, 3233) : m ^ 93,
        plain = rsa ? modPow(cipher, 2753, 3233) : cipher ^ 93;
      return [
        frame("Sender starts with the plaintext.", [["Plaintext", m, "—"]]),
        frame(
          rsa
            ? "Encrypt with the receiver’s public key."
            : "Encrypt with the shared secret key.",
          [["Ciphertext", cipher, rsa ? "Public (17,3233)" : "Shared 93"]],
        ),
        frame(
          rsa
            ? "Only the matching private exponent reverses this toy RSA operation."
            : "Receiver uses the same shared key to reverse XOR.",
          [["Recovered", plain, rsa ? "Private (2753,3233)" : "Shared 93"]],
          { Recovered: plain },
        ),
      ];
    },
  },
  cs_access_control: {
    assumptions:
      "Toy RBAC policy: reader may read, editor may read/write, admin may read/write/delete. Authentication must succeed before permission lookup.",
    columns: ["Check", "Result"],
    parameters: [
      choice("role", "Role", ["Reader", "Editor", "Admin"]),
      choice("action", "Requested action", ["Read", "Write", "Delete"]),
      choice("session", "Session", ["Valid", "Expired"]),
    ],
    run: (p) => {
      const authenticated = p.session === "Valid",
        allowed =
          authenticated &&
          (p.role === "Admin" ||
            p.action === "Read" ||
            (p.role === "Editor" && p.action === "Write"));
      return [
        frame("Validate the session before resolving permissions.", [
          ["Authentication", authenticated ? "Valid" : "Expired"],
        ]),
        frame(
          allowed
            ? "The authenticated role grants this action."
            : "Deny: session or role does not grant this action.",
          [
            ["Role", String(p.role)],
            ["Action", String(p.action)],
            ["Decision", allowed ? "Allow" : "Deny"],
          ],
          { Access: allowed ? "Allowed" : "Denied" },
        ),
      ];
    },
  },
};
