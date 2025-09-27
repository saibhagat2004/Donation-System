// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Donation {
    address public owner;
    mapping(address => uint256) public donations;
    uint256 public totalDonations;
    
    event DonationReceived(address donor, uint256 amount);
    event Withdrawal(address recipient, uint256 amount);
    
    constructor() {
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    function donate() public payable {
        require(msg.value > 0, "Donation amount must be greater than 0");
        donations[msg.sender] += msg.value;
        totalDonations += msg.value;
        emit DonationReceived(msg.sender, msg.value);
    }
    
    function withdrawFunds(uint256 amount) public onlyOwner {
        require(amount <= address(this).balance, "Insufficient funds");
        (bool success, ) = owner.call{value: amount}("");
        require(success, "Withdrawal failed");
        emit Withdrawal(owner, amount);
    }
    
    function getDonationAmount(address donor) public view returns (uint256) {
        return donations[donor];
    }
    
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
}