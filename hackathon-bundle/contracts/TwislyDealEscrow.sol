// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TwislyDealEscrow
 * @notice Minimal USDT escrow for investor offers in Twisly pipeline.
 * @dev Flow: openDeal -> fundDeal -> releaseToAuthor / refundInvestor.
 */
contract TwislyDealEscrow is ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum DealState {
        NONE,
        OPEN,
        FUNDED,
        RELEASED,
        REFUNDED,
        CANCELLED
    }

    struct Deal {
        address author;
        address investor;
        address token;
        uint256 amount;
        uint64 expiry;
        DealState state;
        bytes32 termsHash; // hash of off-chain terms (equity %, milestones, etc.)
    }

    mapping(bytes32 => Deal) public deals;

    event DealOpened(
        bytes32 indexed dealId,
        address indexed author,
        address indexed investor,
        address token,
        uint256 amount,
        uint64 expiry,
        bytes32 termsHash
    );

    event DealFunded(bytes32 indexed dealId, address indexed investor, uint256 amount);
    event DealReleased(bytes32 indexed dealId, address indexed author, uint256 amount);
    event DealRefunded(bytes32 indexed dealId, address indexed investor, uint256 amount);
    event DealCancelled(bytes32 indexed dealId);

    error DealExists();
    error DealNotOpen();
    error DealNotFunded();
    error DealExpired();
    error DealNotExpired();
    error Unauthorized();
    error InvalidParams();

    function openDeal(
        bytes32 dealId,
        address investor,
        address token,
        uint256 amount,
        uint64 expiry,
        bytes32 termsHash
    ) external {
        if (dealId == bytes32(0) || investor == address(0) || token == address(0) || amount == 0 || expiry <= block.timestamp) {
            revert InvalidParams();
        }
        if (deals[dealId].state != DealState.NONE) revert DealExists();

        deals[dealId] = Deal({
            author: msg.sender,
            investor: investor,
            token: token,
            amount: amount,
            expiry: expiry,
            state: DealState.OPEN,
            termsHash: termsHash
        });

        emit DealOpened(dealId, msg.sender, investor, token, amount, expiry, termsHash);
    }

    function fundDeal(bytes32 dealId) external nonReentrant {
        Deal storage d = deals[dealId];
        if (d.state != DealState.OPEN) revert DealNotOpen();
        if (msg.sender != d.investor) revert Unauthorized();
        if (block.timestamp > d.expiry) revert DealExpired();

        IERC20(d.token).safeTransferFrom(msg.sender, address(this), d.amount);
        d.state = DealState.FUNDED;

        emit DealFunded(dealId, msg.sender, d.amount);
    }

    /// @notice Release escrow to author after off-chain checks (called by investor).
    function releaseToAuthor(bytes32 dealId) external nonReentrant {
        Deal storage d = deals[dealId];
        if (d.state != DealState.FUNDED) revert DealNotFunded();
        if (msg.sender != d.investor) revert Unauthorized();

        d.state = DealState.RELEASED;
        IERC20(d.token).safeTransfer(d.author, d.amount);

        emit DealReleased(dealId, d.author, d.amount);
    }

    /// @notice Refund investor if funded but expired before release.
    function refundInvestor(bytes32 dealId) external nonReentrant {
        Deal storage d = deals[dealId];
        if (d.state != DealState.FUNDED) revert DealNotFunded();
        if (block.timestamp <= d.expiry) revert DealNotExpired();

        d.state = DealState.REFUNDED;
        IERC20(d.token).safeTransfer(d.investor, d.amount);

        emit DealRefunded(dealId, d.investor, d.amount);
    }

    /// @notice Cancel unfunded deal before expiry (author or investor).
    function cancelOpenDeal(bytes32 dealId) external {
        Deal storage d = deals[dealId];
        if (d.state != DealState.OPEN) revert DealNotOpen();
        if (msg.sender != d.author && msg.sender != d.investor) revert Unauthorized();

        d.state = DealState.CANCELLED;
        emit DealCancelled(dealId);
    }
}
