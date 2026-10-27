// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/// @title RigNFT
/// @notice The 3,333 Barrel Royale rigs. Each rig's class is fixed by a seed whose hash is committed before
/// the first mint and revealed after the mint, so nobody, the team included, can pick which rig gets which
/// class. Classes come from fixed ranges (2,000 Jack-up, 933 Semi-sub, 333 Drillship, 67 Ultra-deepwater)
/// rotated by an offset drawn at reveal time.
contract RigNFT is ERC721, Ownable2Step, ReentrancyGuard {
    uint256 public constant MAX_SUPPLY = 3_333;
    uint256 public constant MAX_PER_TX = 5;

    uint256 private constant JACKUP_END = 2_000;
    uint256 private constant SEMISUB_END = 2_933;
    uint256 private constant DRILLSHIP_END = 3_266;

    enum Phase {
        Closed,
        OG,
        Crew,
        Public,
        Ended
    }

    enum Class {
        JackUp,
        SemiSub,
        Drillship,
        UltraDeepwater
    }

    address payable public immutable treasury;

    Phase public phase;
    uint256 public price;
    uint256 public totalMinted;
    bytes32 public ogRoot;
    bytes32 public crewRoot;

    bytes32 public seedHash;
    bool public revealed;
    uint256 public offset;

    string private baseURI_;

    event PhaseChanged(Phase phase);
    event PriceSet(uint256 price);
    event ListsSet(bytes32 ogRoot, bytes32 crewRoot);
    event SeedCommitted(bytes32 seedHash);
    event Revealed(uint256 offset);

    error MintClosed();
    error NotOnList();
    error BadQuantity();
    error SoldOut();
    error WrongPayment();
    error MintStarted();
    error NotReady();
    error PhaseOrder();
    error BadSeed();
    error AlreadyRevealed();
    error NotRevealed();
    error TransferFailed();
    error RenounceDisabled();

    constructor(address owner_, address payable treasury_, string memory baseURI) ERC721("Barrel Royale Rig", "RIG") Ownable(owner_) {
        treasury = treasury_;
        baseURI_ = baseURI;
    }

    /* ---------------- setup, before the first mint ---------------- */

    function setPrice(uint256 price_) external onlyOwner {
        if (totalMinted != 0) revert MintStarted();
        price = price_;
        emit PriceSet(price_);
    }

    function setLists(bytes32 og, bytes32 crew) external onlyOwner {
        if (totalMinted != 0) revert MintStarted();
        ogRoot = og;
        crewRoot = crew;
        emit ListsSet(og, crew);
    }

    /// @notice Commit keccak256(abi.encode(seed)) before the first mint.
    function commitSeed(bytes32 hash) external onlyOwner {
        if (totalMinted != 0) revert MintStarted();
        seedHash = hash;
        emit SeedCommitted(hash);
    }

    /// @notice Move the mint forward: OG, then Crew, then public, then ended. It never moves back.
    function setPhase(Phase next) external onlyOwner {
        if (next <= phase) revert PhaseOrder();
        if (seedHash == bytes32(0) || price == 0) revert NotReady();
        phase = next;
        emit PhaseChanged(next);
    }

    /* ---------------- mint ---------------- */

    function mint(uint256 quantity, bytes32[] calldata proof) external payable nonReentrant {
        Phase p = phase;
        if (p == Phase.Closed || p == Phase.Ended) revert MintClosed();
        if (p != Phase.Public) {
            bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(msg.sender))));
            bool onOg = MerkleProof.verifyCalldata(proof, ogRoot, leaf);
            bool onCrew = p == Phase.Crew && MerkleProof.verifyCalldata(proof, crewRoot, leaf);
            if (!onOg && !onCrew) revert NotOnList();
        }
        if (quantity == 0 || quantity > MAX_PER_TX) revert BadQuantity();
        if (totalMinted + quantity > MAX_SUPPLY) revert SoldOut();
        if (msg.value != price * quantity) revert WrongPayment();

        uint256 first = totalMinted + 1;
        totalMinted += quantity;
        for (uint256 i; i < quantity; ++i) _safeMint(msg.sender, first + i);
    }

    /// @notice Send mint proceeds to the treasury. Anyone can call it.
    function withdraw() external nonReentrant {
        (bool ok,) = treasury.call{value: address(this).balance}("");
        if (!ok) revert TransferFailed();
    }

    /* ---------------- classes ---------------- */

    /// @notice Reveal the committed seed once the mint has ended or sold out. The offset also mixes in the
    /// previous block hash, so the result was unknown to everyone until now.
    function reveal(bytes32 seed) external onlyOwner {
        if (revealed) revert AlreadyRevealed();
        if (phase != Phase.Ended && totalMinted != MAX_SUPPLY) revert NotReady();
        if (keccak256(abi.encode(seed)) != seedHash) revert BadSeed();
        offset = uint256(keccak256(abi.encode(seed, blockhash(block.number - 1)))) % MAX_SUPPLY;
        revealed = true;
        emit Revealed(offset);
    }

    function classOf(uint256 tokenId) external view returns (Class) {
        if (!revealed) revert NotRevealed();
        _requireOwned(tokenId);
        uint256 slot = (tokenId - 1 + offset) % MAX_SUPPLY;
        if (slot < JACKUP_END) return Class.JackUp;
        if (slot < SEMISUB_END) return Class.SemiSub;
        if (slot < DRILLSHIP_END) return Class.Drillship;
        return Class.UltraDeepwater;
    }

    /* ---------------- metadata ---------------- */

    function setBaseURI(string calldata uri) external onlyOwner {
        baseURI_ = uri;
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI_;
    }

    function renounceOwnership() public pure override {
        revert RenounceDisabled();
    }
}
