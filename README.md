# Grid Shock

A tactical, turn-based game of chain reactions built with **React**, **TypeScript**, and **Tailwind CSS**.


## 🎮 How to Play

The objective of **Grid Shock** is to take over the entire board by causing chain reactions.


1.  **Placement**: On your turn, click on an empty cell or a cell you already own to add an atom.
2.  **Explosions**: Each cell has a "threshold" based on its neighbors:
    *   **Corners**: 2 atoms
    *   **Edges**: 3 atoms
    *   **Interior**: 4 atoms
3.  **Chain Reaction**: When a cell reaches its threshold, it explodes! It sends its atoms to all adjacent cells (Top, Bottom, Left, Right).
4.  **Takeover**: When an explosion hits a neighbor, that cell is taken over by your color. If the neighbor reaches its threshold, it also explodes, triggering a chain reaction.
5.  **Winning**: You win when you are the only player left with atoms on the board.

## ✨ Features

*   **Two Game Modes**:
    *   **Classic**: Dynamic thresholds based on cell position (2, 3, or 4).
    *   **Fixed**: A consistent threshold of 4 for all cells.
*   **Dynamic UI**: The entire environment reacts to the current player's turn with shifting gradients.
*   **Smooth Animations**: Visualize the chain reaction waves with animated atom clusters.
*   **Customizable Grid**: Play on boards ranging from 3x3 to 10x10.
*   **Persistent Settings**: Your preferred game mode and grid size are remembered between sessions.
*   **Material 3 Design**: A premium, modern interface with glassmorphism effects.

## 🛠️ Tech Stack

*   **Framework**: [React 18](https://reactjs.org/)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
*   **State Management**: [Zustand](https://github.com/pmndrs/zustand)
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **Deployment**: [Vercel](https://vercel.com/)

## 🚀 Getting Started

### Prerequisites

*   Node.js (v18 or higher)
*   npm or yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/Grohon/grid-shock.git
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Start the development server:
    ```bash
    npm run dev
    ```

4.  Build for production:
    ```bash
    npm run build
    ```

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
