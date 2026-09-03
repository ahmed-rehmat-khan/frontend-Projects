const Chess = (function(){
// ============ Chess Engine Core ============
// Board: array of 64 squares, index = rank*8 + file, rank0 = rank1 (white back rank), file0 = 'a'
// Piece: {type:'P'|'N'|'B'|'R'|'Q'|'K', color:'w'|'b'}  or null

function sq(file, rank) { return rank * 8 + file; }
function fileOf(idx) { return idx % 8; }
function rankOf(idx) { return Math.floor(idx / 8); }
function onBoard(f, r) { return f >= 0 && f < 8 && r >= 0 && r < 8; }
function algebraic(idx) {
  return 'abcdefgh'[fileOf(idx)] + (rankOf(idx) + 1);
}
function fromAlgebraic(s) {
  const f = s.charCodeAt(0) - 97;
  const r = parseInt(s[1], 10) - 1;
  return sq(f, r);
}

function initialBoard() {
  const board = new Array(64).fill(null);
  const backRank = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
  for (let f = 0; f < 8; f++) {
    board[sq(f, 0)] = { type: backRank[f], color: 'w' };
    board[sq(f, 1)] = { type: 'P', color: 'w' };
    board[sq(f, 6)] = { type: 'P', color: 'b' };
    board[sq(f, 7)] = { type: backRank[f], color: 'b' };
  }
  return board;
}

function initialState() {
  return {
    board: initialBoard(),
    turn: 'w',
    castling: { wK: true, wQ: true, bK: true, bQ: true },
    epSquare: null,
    halfmove: 0,
    fullmove: 1,
  };
}

function cloneState(state) {
  return {
    board: state.board.slice(),
    turn: state.turn,
    castling: Object.assign({}, state.castling),
    epSquare: state.epSquare,
    halfmove: state.halfmove,
    fullmove: state.fullmove,
  };
}

const KNIGHT_DELTAS = [[1,2],[2,1],[2,-1],[1,-2],[-1,-2],[-2,-1],[-2,1],[-1,2]];
const KING_DELTAS = [[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]];
const BISHOP_DIRS = [[1,1],[1,-1],[-1,1],[-1,-1]];
const ROOK_DIRS = [[1,0],[-1,0],[0,1],[0,-1]];

function opposite(color) { return color === 'w' ? 'b' : 'w'; }

// Is square `idx` attacked by side `byColor`?
function isAttacked(board, idx, byColor) {
  const f0 = fileOf(idx), r0 = rankOf(idx);

  // Pawn attacks: a pawn of byColor attacks idx if it sits diagonally "behind" idx from its own advance direction
  const pawnDir = byColor === 'w' ? -1 : 1; // if white pawn attacks idx, the pawn is at rank-1 (since white moves +1)
  for (const df of [-1, 1]) {
    const f = f0 + df, r = r0 + pawnDir;
    if (onBoard(f, r)) {
      const p = board[sq(f, r)];
      if (p && p.color === byColor && p.type === 'P') return true;
    }
  }

  // Knight
  for (const [df, dr] of KNIGHT_DELTAS) {
    const f = f0 + df, r = r0 + dr;
    if (onBoard(f, r)) {
      const p = board[sq(f, r)];
      if (p && p.color === byColor && p.type === 'N') return true;
    }
  }

  // King
  for (const [df, dr] of KING_DELTAS) {
    const f = f0 + df, r = r0 + dr;
    if (onBoard(f, r)) {
      const p = board[sq(f, r)];
      if (p && p.color === byColor && p.type === 'K') return true;
    }
  }

  // Bishop/Queen diagonals
  for (const [df, dr] of BISHOP_DIRS) {
    let f = f0 + df, r = r0 + dr;
    while (onBoard(f, r)) {
      const p = board[sq(f, r)];
      if (p) {
        if (p.color === byColor && (p.type === 'B' || p.type === 'Q')) return true;
        break;
      }
      f += df; r += dr;
    }
  }

  // Rook/Queen straights
  for (const [df, dr] of ROOK_DIRS) {
    let f = f0 + df, r = r0 + dr;
    while (onBoard(f, r)) {
      const p = board[sq(f, r)];
      if (p) {
        if (p.color === byColor && (p.type === 'R' || p.type === 'Q')) return true;
        break;
      }
      f += df; r += dr;
    }
  }

  return false;
}

function findKing(board, color) {
  for (let i = 0; i < 64; i++) {
    const p = board[i];
    if (p && p.type === 'K' && p.color === color) return i;
  }
  return -1;
}

function inCheck(state, color) {
  const kIdx = findKing(state.board, color);
  if (kIdx === -1) return false;
  return isAttacked(state.board, kIdx, opposite(color));
}

// Generate pseudo-legal moves for the piece at `idx` (does not check king safety)
function pseudoMovesFor(state, idx) {
  const board = state.board;
  const piece = board[idx];
  if (!piece) return [];
  const moves = [];
  const f0 = fileOf(idx), r0 = rankOf(idx);
  const color = piece.color;

  function addMove(to, opts) {
    opts = opts || {};
    moves.push(Object.assign({
      from: idx, to, piece: piece.type, color,
      captured: board[to] ? board[to].type : null,
      capturedColor: board[to] ? board[to].color : null,
      promotion: null,
      enPassant: false,
      castle: null,
      doublePawn: false,
    }, opts));
  }

  if (piece.type === 'P') {
    const dir = color === 'w' ? 1 : -1;
    const startRank = color === 'w' ? 1 : 6;
    const promoRank = color === 'w' ? 7 : 0;
    const oneF = f0, oneR = r0 + dir;
    if (onBoard(oneF, oneR) && !board[sq(oneF, oneR)]) {
      const to = sq(oneF, oneR);
      if (rankOf(to) === promoRank) {
        for (const promo of ['Q', 'R', 'B', 'N']) addMove(to, { promotion: promo });
      } else {
        addMove(to);
        // double push
        if (r0 === startRank) {
          const twoR = r0 + 2 * dir;
          const twoTo = sq(oneF, twoR);
          if (!board[twoTo]) addMove(twoTo, { doublePawn: true });
        }
      }
    }
    // captures
    for (const df of [-1, 1]) {
      const f = f0 + df, r = r0 + dir;
      if (!onBoard(f, r)) continue;
      const to = sq(f, r);
      const target = board[to];
      if (target && target.color !== color) {
        if (rankOf(to) === promoRank) {
          for (const promo of ['Q', 'R', 'B', 'N']) addMove(to, { promotion: promo });
        } else {
          addMove(to);
        }
      } else if (!target && state.epSquare === to) {
        addMove(to, { enPassant: true, captured: 'P', capturedColor: opposite(color) });
      }
    }
  } else if (piece.type === 'N') {
    for (const [df, dr] of KNIGHT_DELTAS) {
      const f = f0 + df, r = r0 + dr;
      if (!onBoard(f, r)) continue;
      const to = sq(f, r);
      const target = board[to];
      if (!target || target.color !== color) addMove(to);
    }
  } else if (piece.type === 'K') {
    for (const [df, dr] of KING_DELTAS) {
      const f = f0 + df, r = r0 + dr;
      if (!onBoard(f, r)) continue;
      const to = sq(f, r);
      const target = board[to];
      if (!target || target.color !== color) addMove(to);
    }
    // Castling
    const rank = color === 'w' ? 0 : 7;
    if (idx === sq(4, rank) && !inCheck(state, color)) {
      const rights = state.castling;
      // king side
      if ((color === 'w' && rights.wK) || (color === 'b' && rights.bK)) {
        const f1 = sq(5, rank), f2 = sq(6, rank), rookSq = sq(7, rank);
        const rook = board[rookSq];
        if (!board[f1] && !board[f2] && rook && rook.type === 'R' && rook.color === color &&
            !isAttacked(board, f1, opposite(color)) && !isAttacked(board, f2, opposite(color))) {
          addMove(f2, { castle: 'K' });
        }
      }
      // queen side
      if ((color === 'w' && rights.wQ) || (color === 'b' && rights.bQ)) {
        const d1 = sq(3, rank), d2 = sq(2, rank), d3 = sq(1, rank), rookSq = sq(0, rank);
        const rook = board[rookSq];
        if (!board[d1] && !board[d2] && !board[d3] && rook && rook.type === 'R' && rook.color === color &&
            !isAttacked(board, d1, opposite(color)) && !isAttacked(board, d2, opposite(color))) {
          addMove(d2, { castle: 'Q' });
        }
      }
    }
  } else {
    // sliding pieces
    let dirs = [];
    if (piece.type === 'B') dirs = BISHOP_DIRS;
    else if (piece.type === 'R') dirs = ROOK_DIRS;
    else if (piece.type === 'Q') dirs = BISHOP_DIRS.concat(ROOK_DIRS);
    for (const [df, dr] of dirs) {
      let f = f0 + df, r = r0 + dr;
      while (onBoard(f, r)) {
        const to = sq(f, r);
        const target = board[to];
        if (!target) {
          addMove(to);
        } else {
          if (target.color !== color) addMove(to);
          break;
        }
        f += df; r += dr;
      }
    }
  }

  return moves;
}

function allPseudoMoves(state, color) {
  const moves = [];
  for (let i = 0; i < 64; i++) {
    const p = state.board[i];
    if (p && p.color === color) {
      moves.push.apply(moves, pseudoMovesFor(state, i));
    }
  }
  return moves;
}

// Apply move, return new state
function makeMove(state, move) {
  const ns = cloneState(state);
  const board = ns.board;
  const piece = board[move.from];
  const color = piece.color;

  // reset ep square, set later if double pawn push
  ns.epSquare = null;

  // en passant capture: remove captured pawn
  if (move.enPassant) {
    const capRank = color === 'w' ? rankOf(move.to) - 1 : rankOf(move.to) + 1;
    board[sq(fileOf(move.to), capRank)] = null;
  }

  // move piece
  board[move.to] = piece;
  board[move.from] = null;

  // promotion
  if (move.promotion) {
    board[move.to] = { type: move.promotion, color };
  }

  // castling: move rook too
  if (move.castle === 'K') {
    const rank = color === 'w' ? 0 : 7;
    board[sq(5, rank)] = board[sq(7, rank)];
    board[sq(7, rank)] = null;
  } else if (move.castle === 'Q') {
    const rank = color === 'w' ? 0 : 7;
    board[sq(3, rank)] = board[sq(0, rank)];
    board[sq(0, rank)] = null;
  }

  // double pawn push -> set ep square
  if (move.doublePawn) {
    const dir = color === 'w' ? 1 : -1;
    ns.epSquare = sq(fileOf(move.from), rankOf(move.from) + dir);
  }

  // update castling rights
  if (piece.type === 'K') {
    if (color === 'w') { ns.castling.wK = false; ns.castling.wQ = false; }
    else { ns.castling.bK = false; ns.castling.bQ = false; }
  }
  if (move.from === sq(0, 0) || move.to === sq(0, 0)) ns.castling.wQ = false;
  if (move.from === sq(7, 0) || move.to === sq(7, 0)) ns.castling.wK = false;
  if (move.from === sq(0, 7) || move.to === sq(0, 7)) ns.castling.bQ = false;
  if (move.from === sq(7, 7) || move.to === sq(7, 7)) ns.castling.bK = false;

  // halfmove clock
  if (piece.type === 'P' || move.captured) ns.halfmove = 0;
  else ns.halfmove = state.halfmove + 1;

  if (color === 'b') ns.fullmove = state.fullmove + 1;

  ns.turn = opposite(color);
  return ns;
}

// Legal moves for a color: filter pseudo moves where own king isn't left in check
function legalMoves(state, color) {
  const pseudo = allPseudoMoves(state, color);
  const legal = [];
  for (const m of pseudo) {
    const ns = makeMove(state, m);
    if (!inCheck(ns, color)) legal.push(m);
  }
  return legal;
}

function legalMovesFrom(state, idx) {
  const piece = state.board[idx];
  if (!piece) return [];
  const pseudo = pseudoMovesFor(state, idx);
  const legal = [];
  for (const m of pseudo) {
    const ns = makeMove(state, m);
    if (!inCheck(ns, piece.color)) legal.push(m);
  }
  return legal;
}

function gameStatus(state) {
  const color = state.turn;
  const moves = legalMoves(state, color);
  const check = inCheck(state, color);
  if (moves.length === 0) {
    if (check) return { status: 'checkmate', winner: opposite(color) };
    return { status: 'stalemate' };
  }
  if (state.halfmove >= 100) return { status: 'draw', reason: 'fifty-move rule' };
  if (insufficientMaterial(state.board)) return { status: 'draw', reason: 'insufficient material' };
  if (check) return { status: 'check' };
  return { status: 'normal' };
}

function insufficientMaterial(board) {
  const pieces = board.filter(Boolean);
  if (pieces.length > 4) return false;
  const nonKing = pieces.filter(p => p.type !== 'K');
  if (nonKing.length === 0) return true; // K vs K
  if (nonKing.length === 1 && (nonKing[0].type === 'N' || nonKing[0].type === 'B')) return true; // K+minor vs K
  if (nonKing.length === 2 && nonKing.every(p => p.type === 'B')) {
    // K+B vs K+B same color bishops
    const bishopSquares = [];
    for (let i = 0; i < 64; i++) if (board[i] && board[i].type === 'B') bishopSquares.push(i);
    if (bishopSquares.length === 2) {
      const c0 = (fileOf(bishopSquares[0]) + rankOf(bishopSquares[0])) % 2;
      const c1 = (fileOf(bishopSquares[1]) + rankOf(bishopSquares[1])) % 2;
      if (c0 === c1) return true;
    }
    return false;
  }
  return false;
}

function perft(state, depth) {
  if (depth === 0) return 1;
  const moves = legalMoves(state, state.turn);
  if (depth === 1) return moves.length;
  let count = 0;
  for (const m of moves) {
    const ns = makeMove(state, m);
    count += perft(ns, depth - 1);
  }
  return count;
}


return {sq, fileOf, rankOf, onBoard, algebraic, fromAlgebraic, initialBoard, initialState, cloneState, opposite, isAttacked, findKing, inCheck, pseudoMovesFor, allPseudoMoves, makeMove, legalMoves, legalMovesFrom, gameStatus, insufficientMaterial, perft};
})();



const AI = (function(){
const E = Chess;

const PIECE_VALUES = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 20000 };

// Piece-square tables (from white's perspective, rank0=rank1 .. rank7=rank8)
const PST = {
  P: [
    0,0,0,0,0,0,0,0,
    5,10,10,-20,-20,10,10,5,
    5,-5,-10,0,0,-10,-5,5,
    0,0,0,20,20,0,0,0,
    5,5,10,25,25,10,5,5,
    10,10,20,30,30,20,10,10,
    50,50,50,50,50,50,50,50,
    0,0,0,0,0,0,0,0,
  ],
  N: [
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,0,5,5,0,-20,-40,
    -30,5,10,15,15,10,5,-30,
    -30,0,15,20,20,15,0,-30,
    -30,5,15,20,20,15,5,-30,
    -30,0,10,15,15,10,0,-30,
    -40,-20,0,0,0,0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50,
  ],
  B: [
    -20,-10,-10,-10,-10,-10,-10,-20,
    -10,5,0,0,0,0,5,-10,
    -10,10,10,10,10,10,10,-10,
    -10,0,10,10,10,10,0,-10,
    -10,5,5,10,10,5,5,-10,
    -10,0,5,10,10,5,0,-10,
    -10,0,0,0,0,0,0,-10,
    -20,-10,-10,-10,-10,-10,-10,-20,
  ],
  R: [
    0,0,0,5,5,0,0,0,
    -5,0,0,0,0,0,0,-5,
    -5,0,0,0,0,0,0,-5,
    -5,0,0,0,0,0,0,-5,
    -5,0,0,0,0,0,0,-5,
    -5,0,0,0,0,0,0,-5,
    5,10,10,10,10,10,10,5,
    0,0,0,0,0,0,0,0,
  ],
  Q: [
    -20,-10,-10,-5,-5,-10,-10,-20,
    -10,0,5,0,0,0,0,-10,
    -10,5,5,5,5,5,0,-10,
    0,0,5,5,5,5,0,-5,
    -5,0,5,5,5,5,0,-5,
    -10,0,5,5,5,5,0,-10,
    -10,0,0,0,0,0,0,-10,
    -20,-10,-10,-5,-5,-10,-10,-20,
  ],
  K: [
    20,30,10,0,0,10,30,20,
    20,20,0,0,0,0,20,20,
    -10,-20,-20,-20,-20,-20,-20,-10,
    -20,-30,-30,-40,-40,-30,-30,-20,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
  ],
};

function pstValue(type, idx, color) {
  const table = PST[type];
  const lookupIdx = color === 'w' ? idx : (63 - idx); // mirror vertically for black
  return table[lookupIdx];
}

function evaluate(state) {
  let score = 0;
  for (let i = 0; i < 64; i++) {
    const p = state.board[i];
    if (!p) continue;
    const val = PIECE_VALUES[p.type] + pstValue(p.type, i, p.color);
    score += p.color === 'w' ? val : -val;
  }
  return score; // positive favors white
}

function orderMoves(moves) {
  return moves.slice().sort((a, b) => {
    const aScore = a.captured ? (PIECE_VALUES[a.captured] - PIECE_VALUES[a.piece] / 10) : 0;
    const bScore = b.captured ? (PIECE_VALUES[b.captured] - PIECE_VALUES[b.piece] / 10) : 0;
    return bScore - aScore;
  });
}

let nodeCount = 0;

function negamax(state, depth, alpha, beta, color) {
  nodeCount++;
  const status = E.gameStatus(state);
  if (status.status === 'checkmate') return -100000 - depth; // side to move is mated -> bad for side to move
  if (status.status === 'stalemate' || status.status === 'draw') return 0;
  if (depth === 0) return color * evaluate(state);

  const moves = orderMoves(E.legalMoves(state, state.turn));
  let best = -Infinity;
  for (const m of moves) {
    const ns = E.makeMove(state, m);
    const val = -negamax(ns, depth - 1, -beta, -alpha, -color);
    if (val > best) best = val;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break; // prune
  }
  return best;
}

// Pick best move for state.turn at given depth. Returns {move, score}
function bestMove(state, depth) {
  nodeCount = 0;
  const color = state.turn === 'w' ? 1 : -1;
  const moves = orderMoves(E.legalMoves(state, state.turn));
  let best = null;
  let bestScore = -Infinity;
  let alpha = -Infinity, beta = Infinity;
  for (const m of moves) {
    const ns = E.makeMove(state, m);
    const val = -negamax(ns, depth - 1, -beta, -alpha, -color);
    if (val > bestScore) { bestScore = val; best = m; }
    if (bestScore > alpha) alpha = bestScore;
  }
  return { move: best, score: bestScore, nodes: nodeCount };
}


return {evaluate, bestMove, PIECE_VALUES};
})();


/* ============ Sound synthesis (Web Audio, no external assets) ============ */
const Sound = (function(){
  let ctx = null;
  let enabled = true;
  function ensureCtx(){
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, start, dur, type, gainPeak){
    const c = ensureCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, c.currentTime + start);
    gain.gain.linearRampToValueAtTime(gainPeak || 0.18, c.currentTime + start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(c.currentTime + start);
    osc.stop(c.currentTime + start + dur + 0.02);
  }
  return {
    setEnabled(v){ enabled = v; },
    isEnabled(){ return enabled; },
    move(){ if(!enabled) return; tone(520, 0, 0.09, 'triangle', 0.16); },
    capture(){ if(!enabled) return; tone(300, 0, 0.11, 'sawtooth', 0.14); tone(180, 0.02, 0.13, 'square', 0.08); },
    castle(){ if(!enabled) return; tone(440,0,0.08,'triangle',0.15); tone(560,0.07,0.09,'triangle',0.13); },
    check(){ if(!enabled) return; tone(760,0,0.1,'square',0.13); tone(880,0.09,0.16,'square',0.14); },
    checkmate(){ if(!enabled) return; tone(660,0,0.16,'sawtooth',0.15); tone(520,0.14,0.18,'sawtooth',0.14); tone(390,0.3,0.35,'sawtooth',0.13); },
    draw(){ if(!enabled) return; tone(440,0,0.2,'sine',0.12); tone(440,0.22,0.28,'sine',0.1); },
    promote(){ if(!enabled) return; tone(600,0,0.08,'triangle',0.15); tone(760,0.07,0.08,'triangle',0.15); tone(960,0.14,0.14,'triangle',0.16); },
    select(){ if(!enabled) return; tone(700,0,0.04,'sine',0.06); },
    illegal(){ if(!enabled) return; tone(180,0,0.12,'square',0.09); },
  };
})();

/* ============ Unicode piece glyphs ============ */
const GLYPH = {
  w: { K:'♔', Q:'♕', R:'♖', B:'♗', N:'♘', P:'♙' },
  b: { K:'♚', Q:'♛', R:'♜', B:'♝', N:'♞', P:'♟' },
};
const PIECE_NAME = { K:'King', Q:'Queen', R:'Rook', B:'Bishop', N:'Knight', P:'Pawn' };

/* ============ App State ============ */
const App = {
  state: Chess.initialState(),
  history: [],        // list of {move, san, boardBefore snapshot not stored (recompute via replay)}
  stateStack: [],      // list of state snapshots for undo (index 0 = initial)
  selected: null,      // square index selected
  legalForSelected: [],
  lastMove: null,      // {from, to}
  mode: 'ai',          // 'ai' | 'human'
  difficulty: 'medium', // easy | medium | hard
  humanColor: 'w',      // color the human plays in AI mode
  orientation: 'w',     // which side is at the bottom
  thinking: false,
  gameOver: null,
  settings: { theme: 'light', sound: true, coords: true },
  pendingPromotion: null, // {from,to,color}
};

const DEPTH_BY_DIFFICULTY = { easy: 1, medium: 2, hard: 3 };

function pushHistorySnapshot(){
  App.stateStack.push(Chess.cloneState(App.state));
}

/* ============ SAN notation ============ */
function toSAN(stateBefore, move, legalBefore, stateAfter){
  if (move.castle === 'K') return sanSuffix('O-O', stateAfter);
  if (move.castle === 'Q') return sanSuffix('O-O-O', stateAfter);
  const destSq = Chess.algebraic(move.to);
  let s = '';
  if (move.piece === 'P'){
    if (move.captured){
      s += 'abcdefgh'[Chess.fileOf(move.from)] + 'x';
    }
    s += destSq;
    if (move.promotion) s += '=' + move.promotion;
  } else {
    s += move.piece;
    // disambiguation
    const others = legalBefore.filter(m => m !== move && m.piece === move.piece && m.to === move.to && m.from !== move.from);
    if (others.length){
      const sameFile = others.some(m => Chess.fileOf(m.from) === Chess.fileOf(move.from));
      const sameRank = others.some(m => Chess.rankOf(m.from) === Chess.rankOf(move.from));
      if (!sameFile) s += 'abcdefgh'[Chess.fileOf(move.from)];
      else if (!sameRank) s += (Chess.rankOf(move.from)+1);
      else s += Chess.algebraic(move.from);
    }
    if (move.captured) s += 'x';
    s += destSq;
  }
  return sanSuffix(s, stateAfter);
}
function sanSuffix(s, stateAfter){
  const status = Chess.gameStatus(stateAfter);
  if (status.status === 'checkmate') return s + '#';
  if (status.status === 'check') return s + '+';
  return s;
}

/* ============ Move execution ============ */
function attemptMove(move){
  const legalBefore = Chess.legalMoves(App.state, App.state.turn);
  const stateBefore = App.state;
  const newState = Chess.makeMove(App.state, move);
  const san = toSAN(stateBefore, move, legalBefore, newState);
  pushHistorySnapshot(); // snapshot BEFORE applying, so undo restores pre-move state -- see below adjust
  App.history.push({ move, san, color: stateBefore.turn });
  App.state = newState;
  App.lastMove = { from: move.from, to: move.to };
  App.selected = null;
  App.legalForSelected = [];
  playSoundFor(move, newState);
  renderAll(true, move);
  checkGameEnd();
  if (!App.gameOver && App.mode === 'ai' && App.state.turn !== App.humanColor){
    scheduleAIMove();
  }
}

function playSoundFor(move, newState){
  const status = Chess.gameStatus(newState);
  if (status.status === 'checkmate'){ Sound.checkmate(); return; }
  if (status.status === 'draw' || status.status === 'stalemate'){ Sound.draw(); return; }
  if (move.promotion){ Sound.promote(); return; }
  if (move.castle){ Sound.castle(); return; }
  if (move.captured){ Sound.capture(); return; }
  if (status.status === 'check'){ Sound.check(); return; }
  Sound.move();
}

function checkGameEnd(){
  const status = Chess.gameStatus(App.state);
  if (status.status === 'checkmate' || status.status === 'stalemate' || status.status === 'draw'){
    App.gameOver = status;
    setTimeout(()=>showGameOver(status), 550);
  }
}

/* ============ AI ============ */
function scheduleAIMove(){
  App.thinking = true;
  renderStatusOnly();
  setTimeout(()=>{
    const depth = DEPTH_BY_DIFFICULTY[App.difficulty];
    let move;
    if (App.difficulty === 'easy'){
      move = pickEasyMove();
    } else {
      const result = AI.bestMove(App.state, depth);
      move = result.move;
    }
    App.thinking = false;
    if (move) attemptMove(move);
  }, 260);
}

function pickEasyMove(){
  // depth-1 search with randomization among reasonable moves to keep it beatable
  const moves = Chess.legalMoves(App.state, App.state.turn);
  if (!moves.length) return null;
  const scored = moves.map(m=>{
    const ns = Chess.makeMove(App.state, m);
    const sign = App.state.turn === 'w' ? 1 : -1;
    return { m, score: sign * AI.evaluate(ns) };
  });
  scored.sort((a,b)=>b.score-a.score);
  const top = Math.max(1, Math.ceil(scored.length * 0.35));
  const pool = scored.slice(0, top);
  const pick = pool[Math.floor(Math.random()*pool.length)];
  return pick.m;
}

/* ============ Interaction ============ */
function onSquareClick(idx){
  if (App.gameOver || App.thinking || App.pendingPromotion) return;
  if (App.mode === 'ai' && App.state.turn !== App.humanColor) return;

  const piece = App.state.board[idx];

  if (App.selected !== null){
    const move = App.legalForSelected.find(m => m.to === idx);
    if (move){
      const promoMoves = App.legalForSelected.filter(m => m.to === idx && m.promotion);
      if (promoMoves.length){
        App.pendingPromotion = { from: App.selected, to: idx, color: App.state.turn, options: promoMoves };
        renderAll(false);
        return;
      }
      attemptMove(move);
      return;
    }
  }

  if (piece && piece.color === App.state.turn){
    App.selected = idx;
    App.legalForSelected = Chess.legalMovesFrom(App.state, idx);
    if (App.legalForSelected.length === 0) Sound.illegal();
    else Sound.select();
    renderAll(false);
  } else if (App.selected !== null){
    Sound.illegal();
    App.selected = null;
    App.legalForSelected = [];
    renderAll(false);
  }
}

function choosePromotion(promoType){
  const p = App.pendingPromotion;
  const move = p.options.find(m => m.promotion === promoType);
  App.pendingPromotion = null;
  attemptMove(move);
}

function cancelPromotion(){
  App.pendingPromotion = null;
  App.selected = null;
  App.legalForSelected = [];
  renderAll(false);
}

/* ============ Undo ============ */
function undoMove(){
  if (App.thinking || App.history.length === 0) return;
  let steps = 1;
  // In AI mode, undo both the AI move and the human move so it's human's turn again
  if (App.mode === 'ai' && App.history.length >= 2){
    const last = App.history[App.history.length-1];
    if (last.color !== App.humanColor) steps = 2;
  }
  for (let i=0;i<steps && App.stateStack.length>0;i++){
    App.state = App.stateStack.pop();
    App.history.pop();
  }
  App.selected = null;
  App.legalForSelected = [];
  App.lastMove = App.history.length ? { from: App.history[App.history.length-1].move.from, to: App.history[App.history.length-1].move.to } : null;
  App.gameOver = null;
  hideGameOver();
  renderAll(false);
}

/* ============ New game / restart ============ */
function newGame(keepSettings){
  App.state = Chess.initialState();
  App.history = [];
  App.stateStack = [];
  App.selected = null;
  App.legalForSelected = [];
  App.lastMove = null;
  App.thinking = false;
  App.gameOver = null;
  App.pendingPromotion = null;
  hideGameOver();
  renderAll(false);
  if (App.mode === 'ai' && App.humanColor === 'b'){
    scheduleAIMove();
  }
}

/* ============ Rendering ============ */
let boardEl, pieceLayerEl;

function squareColorClass(f,r){ return (f+r)%2===0 ? 'dark' : 'light'; }

function displayIndexOrder(){
  // returns array of 64 board indices in the order they should be rendered (top-left to bottom-right)
  const order = [];
  for (let displayRow=0; displayRow<8; displayRow++){
    for (let displayCol=0; displayCol<8; displayCol++){
      let file, rank;
      if (App.orientation === 'w'){
        file = displayCol;
        rank = 7 - displayRow;
      } else {
        file = 7 - displayCol;
        rank = displayRow;
      }
      order.push(Chess.sq(file, rank));
    }
  }
  return order;
}

function squareXY(idx){
  // returns {left,top} in percent for piece-layer absolute positioning based on current orientation
  const f = Chess.fileOf(idx), r = Chess.rankOf(idx);
  let col, row;
  if (App.orientation === 'w'){
    col = f; row = 7 - r;
  } else {
    col = 7 - f; row = r;
  }
  return { left: col*12.5, top: row*12.5 };
}

function buildBoardSkeleton(){
  boardEl.innerHTML = '';
  const order = displayIndexOrder();
  order.forEach((idx, i)=>{
    const f = Chess.fileOf(idx), r = Chess.rankOf(idx);
    const div = document.createElement('div');
    div.className = 'sq ' + squareColorClass(f,r) + ' clickable';
    div.dataset.sq = idx;
    div.addEventListener('click', ()=>onSquareClick(idx));
    // coordinate labels on edges
    const displayCol = i % 8, displayRow = Math.floor(i/8);
    if (App.settings.coords){
      if (displayRow === 7){
        const lab = document.createElement('span');
        lab.className = 'coord file';
        lab.textContent = 'abcdefgh'[f];
        div.appendChild(lab);
      }
      if (displayCol === 0){
        const lab = document.createElement('span');
        lab.className = 'coord rank';
        lab.textContent = (r+1);
        div.appendChild(lab);
      }
    }
    boardEl.appendChild(div);
  });
}

let pieceEls = {}; // squareIndex(current) -> element, tracked via dataset

function rebuildPieces(){
  pieceLayerEl.innerHTML = '';
  pieceEls = {};
  for (let idx=0; idx<64; idx++){
    const p = App.state.board[idx];
    if (!p) continue;
    const el = createPieceEl(p, idx);
    pieceLayerEl.appendChild(el);
    pieceEls[idx] = el;
  }
}

function createPieceEl(piece, idx){
  const el = document.createElement('div');
  el.className = 'piece ' + (piece.color==='w' ? 'white-piece' : 'black-piece');
  el.textContent = GLYPH[piece.color][piece.type];
  el.title = (piece.color==='w'?'White':'Black') + ' ' + PIECE_NAME[piece.type];
  const {left, top} = squareXY(idx);
  el.style.left = left + '%';
  el.style.top = top + '%';
  el.addEventListener('click', (e)=>{ e.stopPropagation(); onSquareClick(idx); });
  return el;
}

function animateMove(move, prevState){
  // move the piece element(s) smoothly; called after App.state already updated
  const movedColor = prevState.turn;
  // captured piece fade (regular capture)
  if (move.captured && !move.enPassant){
    const capEl = pieceEls[move.to];
    if (capEl){ capEl.classList.add('captured-fade'); setTimeout(()=>capEl.remove(), 200); }
  }
  if (move.enPassant){
    const capRank = movedColor === 'w' ? Chess.rankOf(move.to)-1 : Chess.rankOf(move.to)+1;
    const capIdx = Chess.sq(Chess.fileOf(move.to), capRank);
    const capEl = pieceEls[capIdx];
    if (capEl){ capEl.classList.add('captured-fade'); setTimeout(()=>capEl.remove(), 200); delete pieceEls[capIdx]; }
  }
  const moverEl = pieceEls[move.from];
  if (moverEl){
    const {left, top} = squareXY(move.to);
    moverEl.style.left = left + '%';
    moverEl.style.top = top + '%';
    delete pieceEls[move.from];
    pieceEls[move.to] = moverEl;
    if (move.promotion){
      setTimeout(()=>{
        moverEl.textContent = GLYPH[movedColor][move.promotion];
        moverEl.classList.add('pop');
      }, 180);
    }
  }
  if (move.castle){
    const rank = movedColor === 'w' ? 0 : 7;
    const rookFrom = move.castle === 'K' ? Chess.sq(7,rank) : Chess.sq(0,rank);
    const rookTo = move.castle === 'K' ? Chess.sq(5,rank) : Chess.sq(3,rank);
    const rookEl = pieceEls[rookFrom];
    if (rookEl){
      const {left, top} = squareXY(rookTo);
      rookEl.style.left = left + '%';
      rookEl.style.top = top + '%';
      delete pieceEls[rookFrom];
      pieceEls[rookTo] = rookEl;
    }
  }
}

function renderBoard(animated, move, prevState){
  buildBoardSkeleton();
  if (animated && move && prevState){
    // pieces already exist positioned at old squares (from previous render); just move them
    animateMove(move, prevState);
    highlightSquares();
  } else {
    rebuildPieces();
    highlightSquares();
  }
}

function highlightSquares(){
  const squares = boardEl.querySelectorAll('.sq');
  squares.forEach(sqEl=>{
    sqEl.classList.remove('selected','last-from','last-to','king-check');
    const idx = parseInt(sqEl.dataset.sq,10);
    if (App.selected === idx) sqEl.classList.add('selected');
    if (App.lastMove){
      if (App.lastMove.from === idx) sqEl.classList.add('last-from');
      if (App.lastMove.to === idx) sqEl.classList.add('last-to');
    }
    // clear any move indicator children (dots/rings)
    sqEl.querySelectorAll('.move-dot,.move-ring').forEach(n=>n.remove());
  });
  if (App.selected !== null){
    App.legalForSelected.forEach(m=>{
      const sqEl = boardEl.querySelector('[data-sq="'+m.to+'"]');
      if (!sqEl) return;
      const marker = document.createElement('div');
      marker.className = m.captured ? 'move-ring' : 'move-dot';
      sqEl.appendChild(marker);
    });
  }
  const status = Chess.gameStatus(App.state);
  if (status.status === 'check' || status.status === 'checkmate'){
    const kIdx = Chess.findKing(App.state.board, App.state.turn);
    const sqEl = boardEl.querySelector('[data-sq="'+kIdx+'"]');
    if (sqEl) sqEl.classList.add('king-check');
  }
}

function renderCaptured(){
  const board = App.state.board;
  const present = { w:{P:0,N:0,B:0,R:0,Q:0}, b:{P:0,N:0,B:0,R:0,Q:0} };
  for (let i=0;i<64;i++){ const p=board[i]; if(p && p.type!=='K') present[p.color][p.type]++; }
  const startCount = { P:8,N:2,B:2,R:2,Q:1 };
  const order = ['Q','R','B','N','P'];
  function renderSide(color, containerId){
    const el = document.getElementById(containerId);
    el.innerHTML = '';
    order.forEach(t=>{
      const missing = startCount[t] - present[color][t];
      for (let i=0;i<missing;i++){
        const s = document.createElement('span');
        s.textContent = GLYPH[color][t];
        el.appendChild(s);
      }
    });
  }
  renderSide('w','captured-by-black'); // pieces black has captured (white pieces missing)
  renderSide('b','captured-by-white');

  const values = { P:1,N:3,B:3,R:5,Q:9 };
  let whiteScore=0, blackScore=0;
  order.forEach(t=>{ whiteScore += present['w'][t]*values[t]; blackScore += present['b'][t]*values[t]; });
  const diff = whiteScore - blackScore; // positive = white ahead on material
  const diffElW = document.getElementById('material-diff-white');
  const diffElB = document.getElementById('material-diff-black');
  diffElW.textContent = diff > 0 ? '+'+diff : '';
  diffElB.textContent = diff < 0 ? '+'+(-diff) : '';
}

function renderStatusOnly(){
  const card = document.getElementById('status-card');
  const dot = card;
  card.classList.remove('check','over');
  const status = Chess.gameStatus(App.state);
  let text = '';
  if (App.thinking){
    text = 'AI is thinking…';
    card.innerHTML = '<span class="status-dot"></span><span class="thinking-text">'+text+'</span><span class="spinner" style="margin-left:auto;width:14px;height:14px;border-width:2px;border-radius:50%;border:2px solid var(--panel-border);border-top-color:var(--brass);animation:spin 0.7s linear infinite;"></span>';
    return;
  }
  const turnName = App.state.turn === 'w' ? 'White' : 'Black';
  if (status.status === 'checkmate'){
    text = 'Checkmate — ' + (status.winner==='w'?'White':'Black') + ' wins';
    card.classList.add('over');
  } else if (status.status === 'stalemate'){
    text = 'Stalemate — draw';
    card.classList.add('over');
  } else if (status.status === 'draw'){
    text = 'Draw — ' + status.reason;
    card.classList.add('over');
  } else if (status.status === 'check'){
    text = turnName + ' is in check';
    card.classList.add('check');
  } else {
    text = turnName + ' to move';
  }
  card.innerHTML = '<span class="status-dot"></span><span>'+text+'</span>';
}

function renderTurnStrip(){
  const el = document.getElementById('turn-strip');
  const whiteActive = App.state.turn === 'w';
  el.innerHTML = `
    <div class="turn-chip ${whiteActive?'active':''}"><span class="dot"></span>White</div>
    <div class="turn-chip black ${!whiteActive?'active':''}"><span class="dot"></span>Black</div>
  `;
}

function renderHistory(){
  const el = document.getElementById('history-list');
  if (App.history.length === 0){
    el.innerHTML = '<div class="history-empty">No moves yet. Make the first move on the board.</div>';
    return;
  }
  let html = '';
  for (let i=0;i<App.history.length;i+=2){
    const num = i/2 + 1;
    const w = App.history[i];
    const b = App.history[i+1];
    const isLastW = i === App.history.length-1;
    const isLastB = b && (i+1 === App.history.length-1);
    html += `<div class="history-row">
      <div class="history-num">${num}.</div>
      <div class="history-move ${isLastW?'current':''}">${w.san}</div>
      <div class="history-move ${isLastB?'current':''}">${b?b.san:''}</div>
    </div>`;
  }
  el.innerHTML = html;
  el.scrollTop = el.scrollHeight;
}

function renderControlsState(){
  document.querySelectorAll('.mode-btn').forEach(b=>b.classList.toggle('active', b.dataset.mode===App.mode));
  document.querySelectorAll('.diff-btn').forEach(b=>b.classList.toggle('active', b.dataset.diff===App.difficulty));
  document.getElementById('difficulty-row').classList.toggle('disabled', App.mode!=='ai');
  document.getElementById('side-row').classList.toggle('disabled', App.mode!=='ai');
  document.querySelectorAll('.side-btn').forEach(b=>b.classList.toggle('active', b.dataset.side===App.humanColor));
  document.getElementById('undo-btn').disabled = App.history.length===0 || App.thinking;
}

function renderAll(animated, move){
  const prevState = animated ? App.stateStack[App.stateStack.length-1] : null;
  renderBoard(animated, move, prevState);
  renderCaptured();
  renderStatusOnly();
  renderTurnStrip();
  renderHistory();
  renderControlsState();
  renderPromotionOverlay();
}

/* ============ Game over modal ============ */
function showGameOver(status){
  const overlay = document.getElementById('gameover-overlay');
  const icon = document.getElementById('go-icon');
  const title = document.getElementById('go-title');
  const desc = document.getElementById('go-desc');
  if (status.status === 'checkmate'){
    icon.textContent = status.winner==='w' ? '♔' : '♚';
    title.textContent = 'Checkmate';
    desc.textContent = (status.winner==='w'?'White':'Black') + ' wins the game.';
  } else if (status.status === 'stalemate'){
    icon.textContent = '½';
    title.textContent = 'Stalemate';
    desc.textContent = 'No legal moves remain — the game is a draw.';
  } else {
    icon.textContent = '½';
    title.textContent = 'Draw';
    desc.textContent = 'Draw by ' + status.reason + '.';
  }
  overlay.style.display = 'flex';
}
function hideGameOver(){
  document.getElementById('gameover-overlay').style.display = 'none';
}

/* ============ Settings ============ */
function applyTheme(){
  document.documentElement.classList.toggle('dark', App.settings.theme === 'dark');
}
function openSettings(){ document.getElementById('settings-overlay').style.display='flex'; }
function closeSettings(){ document.getElementById('settings-overlay').style.display='none'; }

/* ============ Promotion overlay ============ */
function renderPromotionOverlay(){
  let existing = document.getElementById('promo-overlay');
  if (existing) existing.remove();
  if (!App.pendingPromotion) return;
  const p = App.pendingPromotion;
  const overlay = document.createElement('div');
  overlay.className = 'promo-overlay';
  overlay.id = 'promo-overlay';
  const box = document.createElement('div');
  box.className = 'promo-box';
  ['Q','R','B','N'].forEach(t=>{
    const btn = document.createElement('div');
    btn.className = 'promo-choice';
    btn.textContent = GLYPH[p.color][t];
    btn.title = 'Promote to ' + PIECE_NAME[t];
    btn.addEventListener('click', ()=>choosePromotion(t));
    box.appendChild(btn);
  });
  overlay.appendChild(box);
  overlay.addEventListener('click', (e)=>{ if(e.target===overlay) cancelPromotion(); });
  document.getElementById('board-inner').appendChild(overlay);
}

/* ============ Wiring ============ */
function initUI(){
  boardEl = document.getElementById('board-grid');
  pieceLayerEl = document.getElementById('piece-layer');

  document.querySelectorAll('.mode-btn').forEach(b=>{
    b.addEventListener('click', ()=>{
      App.mode = b.dataset.mode;
      newGame(true);
    });
  });
  document.querySelectorAll('.diff-btn').forEach(b=>{
    b.addEventListener('click', ()=>{
      App.difficulty = b.dataset.diff;
      renderControlsState();
    });
  });
  document.querySelectorAll('.side-btn').forEach(b=>{
    b.addEventListener('click', ()=>{
      App.humanColor = b.dataset.side;
      newGame(true);
    });
  });

  document.getElementById('new-game-btn').addEventListener('click', ()=>newGame(true));
  document.getElementById('restart-btn').addEventListener('click', ()=>newGame(true));
  document.getElementById('undo-btn').addEventListener('click', undoMove);
  document.getElementById('flip-btn').addEventListener('click', ()=>{
    App.orientation = App.orientation === 'w' ? 'b' : 'w';
    renderAll(false);
  });
  document.getElementById('settings-btn').addEventListener('click', openSettings);
  document.getElementById('settings-close').addEventListener('click', closeSettings);
  document.getElementById('settings-overlay').addEventListener('click', (e)=>{ if(e.target.id==='settings-overlay') closeSettings(); });

  document.getElementById('theme-switch').addEventListener('click', (e)=>{
    App.settings.theme = App.settings.theme === 'light' ? 'dark' : 'light';
    applyTheme();
    e.currentTarget.classList.toggle('on', App.settings.theme==='dark');
  });
  document.getElementById('sound-switch').addEventListener('click', (e)=>{
    App.settings.sound = !App.settings.sound;
    Sound.setEnabled(App.settings.sound);
    e.currentTarget.classList.toggle('on', App.settings.sound);
  });
  document.getElementById('coords-switch').addEventListener('click', (e)=>{
    App.settings.coords = !App.settings.coords;
    e.currentTarget.classList.toggle('on', App.settings.coords);
    renderAll(false);
  });

  document.getElementById('go-newgame').addEventListener('click', ()=>{ hideGameOver(); newGame(true); });
  document.getElementById('go-close').addEventListener('click', hideGameOver);

  applyTheme();
  renderAll(false);
}

document.addEventListener('DOMContentLoaded', initUI);
