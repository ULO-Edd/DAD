# DAD Project - Bisca Game Platform

## Overview

The DAD project aims to develop and deploy the **Bisca Game Platform** as a web application. The platform is a distributed system that provides users with the ability to play the traditional Portuguese card game Bisca in single-player and multiplayer modes, manage their coins, and track their gaming statistics.

The web client is implemented as a **Single-Page Application (SPA)** built with **Vue.js** and hosted on the designated internal school server. The backend system includes a database, a RESTful API server, and a WebSocket server for real-time multiplayer gameplay.

## Project Architecture

### Frontend
- **Technology**: Vue.js SPA
- **Purpose**: User interface for game play, user management, coin transactions, and statistics visualization
- **Features**: Real-time game updates via WebSockets, responsive design, player profiles, leaderboards

### Backend
- **RESTful API Server**: Handles user authentication, coin transactions, game history, leaderboards, and administrative operations
- **WebSocket Server**: Manages real-time multiplayer game communication, ensuring the server acts as the authoritative source for game state
- **Database**: Persists user data, game results, transactions, and platform statistics

## Constraints

The project must adhere to the following mandatory constraints:

1. **Single-Page Application (SPA)** - The application must be implemented exclusively as an SPA
2. **Vue.js Requirement** - The client application must be built with Vue.js
3. **Payment Gateway Integration** - All external coin purchases must be processed via the provided RESTful API (Payment Gateway Service)
4. **Deployment** - The application must be deployed on the designated internal school server and be accessible via a desktop web browser
5. **Backend Technologies** - Must be open-source or available as free external services
6. **Server Compatibility** - Backend technologies must be installable on or accessible from the designated server; if not supported, compliant alternatives must be selected
7. **Database Seeding** - The deployed application's database must be seeded with realistic data in both scale and content to simulate typical usage patterns

## Core Features

### 1. User Management
- **Registration**: Users register with email, nickname, name, password (minimum 3 characters), and optional photo/avatar
- **Authentication**: Email and password-based login
- **Profile Management**: View and update profile information, change password
- **Sign Out**: Users can end their session
- **Account Deletion**: Requires explicit confirmation; permanently forfeits all coins
- **Welcome Bonus**: New users receive 10 coins upon registration
- **Admin Accounts**: Created only by existing administrators; same profile capabilities as users but cannot delete their own accounts

### 2. Coins and Transactions
- **Coin Balance**: Users can view their current coin balance
- **Coin Purchases**: External purchases via Payment Gateway Service
- **Conversion Rate**: €1 = 10 coins (purchases in €1 increments)
- **Coin Earning**: Players earn coins through gameplay and bonuses
- **Transaction History**: All coin-related transactions (bonuses, purchases, spending, earnings) are logged
- **History Access**: 
  - Players view only their own transaction history
  - Administrators have read-only access to all players' histories
  - Administrators cannot create, modify, or delete transactions

### 3. Games and Matches

#### Game Variants
- **Bisca de 3**: Three-card hands
- **Bisca de 9**: Nine-card hands

#### Game Modes
- **Single-Player**: Against a bot (available to anonymous and registered users)
- **Multiplayer**: Against human opponents (available only to registered users)
- **Match**: Best-of series (up to 4 marks/wins) with two players

#### Game Rules
- Games and matches are limited to two players
- The bot follows game rules and attempts to win when playing second; otherwise plays its lowest-value card
- Official Bisca rules apply (as defined in the "Bisca Game" documentation)

#### Multiplayer Gameplay
- **Real-Time Communication**: WebSockets for live game updates
- **Server Authority**: The server is the source of truth for:
  - Card dealing
  - Turn order
  - Valid moves
  - Trick resolution
  - Drawing from stock
  - Scoring
  - End-of-game/match conditions
- **Move Timer**: 20-second limit per move
- **Resignation**: 
  - Opponent awarded all remaining cards
  - Game ends immediately
  - If in a match, player forfeits all remaining games
  - Scores computed accordingly
- **Persistent Results**: Game and match results with metadata are persisted for user history and administrative access

### 4. Game History and Leaderboards

#### Tracking
- **Scope**: Only multiplayer games and matches are tracked
- **Metadata**: Start/end timestamps, variant, outcome (win/loss/draw/forfeit), final points, marks (capote, bandeira), duration

#### History Access
- **Players**: View only their own multiplayer history
- **Administrators**: Read-only access to all players' histories and detailed records
- **Detailed Records**: Visible only to administrators and participating players

#### Leaderboards
- **Personal Leaderboards**: Visible only to the owner; summarize totals for game wins, match wins, capotes, and bandeiras (optionally segmented by variant)
- **Global Leaderboards**: Visible to all users including anonymous visitors; highlight top players by game and match wins, may include capotes and bandeiras
- **Tie-Breaking**: Earlier achievers rank higher in case of ties

### 5. Administration

#### Administrator Capabilities
- **Profile Management**: Same as regular users, except cannot delete their own accounts
- **Account Management**: Create new administrator accounts, remove any account except their own
- **Soft Deletion**: Player accounts with prior activity must be soft-deleted
- **User Monitoring**: View all users (players and administrators), block/unblock players
- **Read-Only Access**:
  - All transactions
  - All multiplayer games and matches
  - Platform usage summaries and statistics

#### Administrator Access Control
- Cannot play games or hold coins
- New administrator accounts can only be created by existing administrators

### 6. Statistics and Reporting

#### Anonymous Users and Players
- Access only generic, anonymized aggregates:
  - Total registered players
  - Games and matches played
  - Recent activity summaries

#### Administrators
- Full, non-anonymized access including:
  - Purchases by period and player
  - Game/match volumes
  - User activity breakdowns
  - Time-series data

#### Visualization
- Statistics available in both visual (charts) and textual/tabular forms
- Privacy for non-admin viewers is preserved
- Exact metrics and visualizations are team-defined

## Enhancement and Innovation Opportunities

To distinguish this project, consider implementing one or more of the following:

### Custom Features (Examples)
- Support for three or more players per game (optional extension while preserving two-player mode)
- Spectator mode for multiplayer games and matches
- Full playback of past games
- Custom card sets
- Extended bot capabilities (e.g., improved AI strategies)
- Integration of bots into multiplayer games

### Architecture and Performance Enhancements (Examples)
- Queue server or worker for asynchronous, long-running operations
- Horizontal scaling of the WebSocket server
- Session recovery after WebSocket or node failures
- Cache server implementation
- NoSQL database for specific use cases
- Search engine for game history or statistics
- Asynchronous messaging broker (e.g., Kafka, RabbitMQ)
- Distributed components for improved scalability and resilience

### Implementation Quality
- Use of technologies or techniques not covered in standard coursework
- Performance optimization with empirical benchmarks
- Improved architecture and code structure
- Enhanced implementation quality and documentation

**Note**: Credit is proportional to demonstrated impact with preference given to distributed capabilities that improve architecture, scalability, or resilience.

## Technology Stack

### Frontend
- Vue.js (mandatory)
- Vite (build tool)
- ESLint (code quality)

### Backend
- **API Server**: Open-source, student-selected technology
- **WebSocket Server**: Open-source, student-selected technology
- **Database**: Open-source, student-selected technology
- All must be compatible with the designated school server

### Supported Variants
- Laravel (PHP) for REST API 
- Node.js for WebSocket server 

## Project Structure

```
DADProject/
├── api/                    # Laravel REST API backend
├── frontend/               # Vue.js SPA
├── websockets/            # WebSocket server
└── README.md              # This file
```

## Getting Started

Refer to the individual `README.md` files in each directory for setup and deployment instructions:

- [API Documentation](./api/README.md)
- [Frontend Documentation](./frontend/README.md)
- [WebSocket Server Documentation](./websockets/README.md)

## Database Schema

The application's database includes the following primary entities:

- **Users**: Player and administrator accounts
- **Games**: Individual game records (both single-player and multiplayer)
- **Matches**: Match records (series of games)
- **Coin Transactions**: Purchase and spending history
- **Coin Transaction Types**: Transaction categorization
- **Coin Purchases**: External purchase records
- **Leaderboard Data**: Aggregated player statistics

For detailed schema information, refer to the database migrations in the `api/database/migrations/` directory.

## Key Business Rules

1. **Coin System**:
   - New users receive 10 welcome coins
   - Conversion rate: €1 = 10 coins
   - Coin purchases are made in €1 increments
   - All transactions are logged and immutable (except soft-deleted accounts)

2. **Game Rules**:
   - Two-player games only (in standard mode)
   - Bot cannot be played in multiplayer
   - 20-second move timer in multiplayer
   - Resignation forfeits remaining games in a match

3. **Account Management**:
   - Administrators cannot be created via public registration
   - Administrators cannot delete their own accounts
   - Account deletion requires explicit confirmation
   - Soft deletion preserves historical data for deleted player accounts

4. **Leaderboard Ranking**:
   - Multiplayer games and matches only
   - Ties resolved by earlier achievement date

## Notes for Developers

- The WebSocket server acts as the authoritative source for all game state in multiplayer games
- Ensure proper error handling and recovery for WebSocket disconnections
- All coin transactions must be atomic and immutable
- Database must be seeded with realistic, varied data
- Privacy and data protection must be maintained throughout

## License

This project is part of the EI – DAD 2025/26 course.
