import { Methods } from "./.rtag/methods";
import {
  UserData,
  Result,
  GameStatus,
  Color,
  Piece,
  PlayerState,
  ICreateGameRequest,
  IStartGameRequest,
  IMovePieceRequest,
  PieceType,
  PlayerName,
} from "./.rtag/types";
import { Chess, ChessInstance, Piece as ChessPiece, Square } from "chess.js";

interface InternalUser {
  name: PlayerName;
  color: Color;
}

interface InternalState {
  chess: ChessInstance;
  users: InternalUser[];
  captures: Piece[];
  history: string[];
}

export class Impl implements Methods<InternalState> {
  createGame(user: UserData, request: ICreateGameRequest): InternalState {
    return {
      chess: new Chess(),
      users: [{ name: user.name, color: Color.WHITE }],
      captures: [],
      history: [],
    };
  }
  startGame(state: InternalState, user: UserData, request: IStartGameRequest): Result {
    if (state.users.find((u) => u.name === user.name) !== undefined) {
      return Result.error("Need opponent to start game");
    }
    state.users.push({ name: user.name, color: Color.BLACK });
    return Result.success();
  }
  movePiece(state: InternalState, user: UserData, request: IMovePieceRequest): Result {
    if (gameStatus(state) === GameStatus.WAITING) {
      return Result.error("Game not started");
    }
    const color = state.users.find((u) => u.name === user.name)?.color;
    if (convertColor(state.chess.turn()) !== color) {
      return Result.error("Not your turn");
    }
    const move = state.chess.move({ from: request.from as Square, to: request.to as Square });
    if (move === null) {
      return Result.error("Invalid move");
    }
    if (move.captured !== undefined) {
      state.captures.push({
        color: color == Color.WHITE ? Color.BLACK : Color.WHITE,
        type: convertType(move.captured),
        square: "CAPTURED",
      });
    }
    state.history.push(move.san);
    return Result.success();
  }
  getUserState(state: InternalState, user: UserData): PlayerState {
    const internalUser = state.users.find((u) => u.name === user.name);
    return {
      board: state.chess.board().flatMap((pieces, i) => {
        return pieces.flatMap((piece, j) => (piece === null ? [] : convertPiece(piece, i, j)));
      }),
      captures: state.captures,
      history: state.history,
      status: gameStatus(state),
      color: internalUser?.color ?? Color.NONE,
      opponent: internalUser !== undefined ? state.users.find((u) => u.name !== user.name)?.name : undefined,
    };
  }
}

function gameStatus(state: InternalState) {
  if (state.users.length < 2) {
    return GameStatus.WAITING;
  }
  return state.chess.turn() === "w" ? GameStatus.WHITE_TURN : GameStatus.BLACK_TURN;
}

function convertPiece(piece: ChessPiece, i: number, j: number): Piece {
  const color = convertColor(piece.color);
  const type = convertType(piece.type);
  const square = ["a", "b", "c", "d", "e", "f", "g", "h"][j] + (8 - i);
  return {
    color,
    type,
    square,
  };
}

function convertColor(color: "w" | "b"): Color {
  switch (color) {
    case "w":
      return Color.WHITE;
    case "b":
      return Color.BLACK;
  }
}

function convertType(type: "p" | "n" | "b" | "r" | "q" | "k"): PieceType {
  switch (type) {
    case "p":
      return PieceType.PAWN;
    case "n":
      return PieceType.KNIGHT;
    case "b":
      return PieceType.BISHOP;
    case "r":
      return PieceType.ROOK;
    case "q":
      return PieceType.QUEEN;
    case "k":
      return PieceType.KING;
  }
}
