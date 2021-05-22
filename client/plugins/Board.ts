import { LitElement, html, property } from "lit-element";
import { Board, Color, Piece, PieceType, PlayerState } from "../.rtag/types";
import { RtagClient } from "../.rtag/client";
import "chessboard-element";

export default class BoardEl extends LitElement {
  @property() val!: Board;
  @property() state!: PlayerState;
  @property() client!: RtagClient;

  render() {
    return html`<chess-board
      draggable-pieces
      orientation=${this.state.color === Color.BLACK ? "black" : "white"}
    ></chess-board>`;
  }

  firstUpdated() {
    const board = this.shadowRoot?.querySelector("chess-board");
    board!.addEventListener("drop", async (e) => {
      const res = await this.client.movePiece({ from: e.detail.source, to: e.detail.target });
      if (res !== undefined) {
        board?.setPosition(e.detail.oldPosition);
        this.dispatchEvent(new CustomEvent("error", { detail: res }));
      }
    });
  }

  updated() {
    const board = this.shadowRoot?.querySelector("chess-board");
    const position = this.val.reduce((x, piece) => {
      return Object.assign(x, { [piece.square]: pieceToString(piece) });
    }, {});
    board?.setPosition(position);
  }
}

function pieceToString(piece: Piece) {
  const colorStr = (() => {
    switch (piece.color) {
      case Color.WHITE:
        return "w";
      case Color.BLACK:
        return "b";
    }
  })();
  const typeStr = (() => {
    switch (piece.type) {
      case PieceType.PAWN:
        return "P";
      case PieceType.KNIGHT:
        return "N";
      case PieceType.BISHOP:
        return "B";
      case PieceType.ROOK:
        return "R";
      case PieceType.QUEEN:
        return "Q";
      case PieceType.KING:
        return "K";
    }
  })();
  return colorStr + typeStr;
}
