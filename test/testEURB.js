const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EURB", function () {
  let Proxy, proxy;
  let Token, token;

  let owner, minter, burner, protector, acc, anotherAcc, acc2, others;

  let name = "EURB"
  let symbol = "EURB"
  let decimals = 18
  let uri = "example.com"
  let newUri = "example.com/new"

  before(async () => {
    [owner, minter, burner, protector, acc, anotherAcc, acc2, ...others] = await ethers.getSigners();
    console.log(`Owner: ${owner.address}\nMinter: ${minter.address}\nBurner: ${burner.address}`)
  })

  beforeEach(async function() {
      
    //Deploy token contract
    Token = await ethers.getContractFactory("EURB")
    token = await Token.deploy()
    await token.deployed()

    Proxy = await ethers.getContractFactory("Proxy")
    proxy = await Proxy.deploy(token.address)
    await proxy.deployed()

    token = await Token.attach(proxy.address)
    await token.deployed()

    // await token.transferOwnership(acc.address)
    // await token.connect(acc).transferOwnership(owner.address)

    await token.grantRole("0x0000000000000000000000000000000000000000000000000000000000000000", owner.address)

    await token.grantRole("0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6", minter.address)

    await token.grantRole("0x3c11d16cbaffd01df69ce1c404f6340ee057498f5f00246190ea54220576a848", burner.address)

    await token.grantRole("0xe3e4f9d7569515307c0cdec302af069a93c9e33f325269bac70e6e22465a9796", protector.address)

    await token.setName(name)

    await token.setSymbol(symbol)

    await token.setDecimals(decimals)

    await token.setUrl(uri)

    await token.setFeeReceiver(owner.address)

    await token.setFeePercentage(1000)
  })

  describe("Test value", function () {
  
    it('has a proxy owner', async () => {
      expect(await proxy.proxyOwner()).to.be.equal(owner.address)
    })

    it('has a name', async () => {
      expect(await token.name()).to.be.equal(name)
    })

    it('has a symbol', async () => {
      expect(await token.symbol()).to.be.equal(symbol)
    })

    it('has 18 decimals', async () => {
      expect(await token.decimals()).to.be.equal(decimals)
    })

    it('has uri', async () => {
      expect(await token.uri()).to.be.equal(uri)
    })

    it('has fee receiver', async () => {
      expect(await token._feeReceiver()).to.be.equal(owner.address)
    })

    it('proxy owner is token owner', async () => {
      expect(await token.owner()).to.be.equal(owner.address)
    })

    
  })

  describe('pause', () => {
    it('only proxy owner can pause', async () => {
      await expect(token.connect(minter).pause()).to.be.reverted
      expect(await token.connect(owner).pause()).to.be.ok
    })

    it('can not pause if paused', async () => {
      expect(await token.connect(owner).pause()).to.be.ok
      await expect(token.connect(owner).pause()).to.be.reverted
    })
  })

  describe('unpause', () => {
    it('only proxy owner can pause', async () => {
      expect(await token.connect(owner).pause()).to.be.ok
      await expect(token.connect(minter).unpause()).to.be.reverted
      expect(await token.connect(owner).unpause()).to.be.ok
    })

    it('can not unpause if unpaused', async () => {
      expect(await token.connect(owner).pause()).to.be.ok
      expect(await token.connect(owner).unpause()).to.be.ok
      await expect(token.connect(owner).unpause()).to.be.reverted
    })
  })

  describe("transferOwnership", () => {
    it('only proxy owner can transfer token owner', async () => {
      await expect(token.connect(minter).transferOwnership(owner.address)).to.be.reverted
      expect(await token.connect(owner).transferOwnership(minter.address)).to.be.ok
      expect(await token.owner()).to.be.equal(minter.address)
    })
  })

  describe("grantRole", () => {
    it('only proxy owner can grant role', async () => {
      await expect(token.connect(minter).grantRole("0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6",owner.address)).to.be.reverted
      expect(await token.connect(owner).grantRole("0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6",minter.address)).to.be.ok
      expect(await token.hasRole("0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6",minter.address)).to.be.equal(true)
    })
  })

  describe("setUrl", () => {
    it('URI can only be set by token owner', async () => {
      await expect(token.connect(minter).setUrl(newUri)).to.be.reverted
      expect(await token.connect(owner).setUrl(newUri)).to.be.ok
      expect(await token.uri()).to.be.equal(newUri)
    })
  })

  describe("setName", () => {
    it('Token name can only be set by token owner', async () => {
      await expect(token.connect(minter).setName("EURA")).to.be.reverted
      expect(await token.connect(owner).setName("EURA")).to.be.ok
      expect(await token.name()).to.be.equal("EURA")
    })
  })

  describe("setSymbol", () => {
    it('Token symbol can only be set by token owner', async () => {
      await expect(token.connect(minter).setSymbol("EURA")).to.be.reverted
      expect(await token.connect(owner).setSymbol("EURA")).to.be.ok
      expect(await token.symbol()).to.be.equal("EURA")
    })
  })

  describe("setDecimals", () => {
    it('Token decimals can only be set by token owner', async () => {
      await expect(token.connect(minter).setDecimals(9)).to.be.reverted
      expect(await token.connect(owner).setDecimals(9)).to.be.ok
      expect(await token.decimals()).to.be.equal(9)
    })
  })

  describe("setFeePercentage", () => {
    it('Token fee percentage can only be set by token owner', async () => {
      await expect(token.connect(minter).setFeePercentage(10000)).to.be.reverted
      expect(await token.connect(owner).setFeePercentage(10000)).to.be.ok
      expect(await token._feePercentage()).to.be.equal(10000)
    })

    it('Token fee percentage can not more than 100%', async () => {
      await expect(token.connect(owner).setFeePercentage(100001)).to.be.reverted
    })
  })

  describe("setFeeReceiver", () => {
    it('Token fee receiver can only be set by token owner', async () => {
      await expect(token.connect(minter).setFeeReceiver(acc.address)).to.be.reverted
      expect(await token.connect(owner).setFeeReceiver(acc.address)).to.be.ok
      expect(await token._feeReceiver()).to.be.equal(acc.address)
    })
  })

  describe("excludeSenderFromFee", () => {
    it('Account that is exclude from paying fee can only be set by token owner', async () => {
      await expect(token.connect(minter).excludeSenderFromFee(acc.address)).to.be.reverted
      expect(await token.connect(owner).excludeSenderFromFee(acc.address)).to.be.ok
      expect(await token.isExcludedFromFee(acc.address)).to.be.equal(true)
      expect(await token.isTransactionExcludedFromFee(acc.address, anotherAcc.address)).to.be.equal(true)
      expect(await token.getTransactionFee(acc.address, anotherAcc.address,100)).to.be.equal(0)
    })
  })

  describe("includeSenderInFee", () => {
    it('Account that is includeIn paying fee can only be set by token owner', async () => {
      await expect(token.connect(minter).includeSenderInFee(acc.address)).to.be.reverted
      expect(await token.connect(owner).includeSenderInFee(acc.address)).to.be.ok
      expect(await token.isExcludedFromFee(acc.address)).to.be.equal(false)
      expect(await token.isTransactionExcludedFromFee(acc.address, anotherAcc.address)).to.be.equal(false)
      expect(await token.getTransactionFee(acc.address, anotherAcc.address,100)).to.be.equal(1)
    })
  })

  describe("excludeReceiverFromFee", () => {
    it('Account that is exclude from paying fee can only be set by token owner', async () => {
      await expect(token.connect(minter).excludeReceiverFromFee(acc.address)).to.be.reverted
      expect(await token.connect(owner).excludeReceiverFromFee(acc.address)).to.be.ok
      expect(await token.isReceiverExcludedFromFee(acc.address)).to.be.equal(true)
      expect(await token.isTransactionExcludedFromFee(anotherAcc.address, acc.address)).to.be.equal(true)
      expect(await token.getTransactionFee(anotherAcc.address, acc.address,100)).to.be.equal(0)
    })
  })

  describe("includeReceiverInFee", () => {
    it('Account that is includeIn paying fee can only be set by token owner', async () => {
      await expect(token.connect(minter).includeReceiverInFee(acc.address)).to.be.reverted
      expect(await token.connect(owner).includeReceiverInFee(acc.address)).to.be.ok
      expect(await token.isReceiverExcludedFromFee(acc.address)).to.be.equal(false)
      expect(await token.isTransactionExcludedFromFee(anotherAcc.address, acc.address)).to.be.equal(false)
      expect(await token.getTransactionFee(anotherAcc.address, acc.address,100)).to.be.equal(1)
    })
  })

  describe("mint", () => {
    it('normal case', async () => {
      expect(await token.connect(minter).mint(acc.address,1000)).to.be.ok
    })


    it('Can not mint if paused', async () => {
      expect(await token.connect(owner).pause()).to.be.ok
      expect(await token.paused()).to.be.equal(true)
      await expect(token.connect(minter).mint(acc.address, 1000)).to.be.reverted

    })


    it('Can not mint if not called by minter', async () => {
      await expect(token.connect(owner).mint(acc.address, 1000)).to.be.reverted

    })
  })


  describe("burn", () => {
    it('normal case', async () => {
      expect(await token.connect(minter).mint(owner.address, 1000)).to.be.ok
      expect(await token.connect(burner).burn(1000)).to.be.ok
      expect(await token.connect(minter).mint(owner.address, 1000)).to.be.ok
      expect(await token.connect(protector).burn(1000)).to.be.ok
    })


    it('can not burn amount exceeding balance', async () => {
      expect(await token.connect(minter).mint(owner.address, 1000)).to.be.ok
      await expect(token.connect(burner).burn(1001)).to.be.reverted
      
    })


    it('Can not burn if paused', async () => {
      expect(await token.connect(owner).pause()).to.be.ok
      expect(await token.paused()).to.be.equal(true)
      await expect(token.connect(burner).burn(1000)).to.be.reverted

    })


    it('Can not burn if not called by burner or asset protector', async () => {
      await expect(token.connect(owner).burn(1000)).to.be.reverted

    })
  })

  describe('burnFrom', () => {
    it('normal case', async () => {
      expect(await token.connect(minter).mint(acc.address, 1000)).to.be.ok
      expect(await token.connect(acc).safeApprove(burner.address, 0, 1000)).to.be.ok
      expect(await token.connect(burner).burnFrom(acc.address, 1000)).to.be.ok
      
    })


    it('can not burn amount exceeding balance', async () => {
      expect(await token.connect(minter).mint(acc.address, 1000)).to.be.ok
      expect(await token.connect(acc).safeApprove(burner.address, 0, 1000)).to.be.ok
      await expect(token.connect(burner).burnFrom(acc.address, 1001)).to.be.reverted
      
    })


    it('Can not burn if paused', async () => {
      expect(await token.connect(owner).pause()).to.be.ok
      expect(await token.paused()).to.be.equal(true)
      await expect(token.connect(burner).burnFrom(acc.address, 1000)).to.be.reverted

    })


    it('Can not burn if not called by burner  or asset protector', async () => {
      await expect(token.connect(owner).burnFrom(acc.address, 1000)).to.be.reverted

    })

    // it('Can not burn if not safeApproved before', async () => {
    //   expect(await token.connect(minter).mint(acc.address, 1000)).to.be.ok
    //   await expect(token.connect(burner).burnFrom(acc.address, 1000)).to.be.reverted
    // })
  })


  describe('transfer', () => {
    it('normal case', async () => {
      expect(await token.connect(minter).mint(acc.address, 1000)).to.be.ok
      expect(await token.connect(acc).transfer(anotherAcc.address, 1000)).to.be.ok
      expect(await token.balanceOf(acc.address)).to.be.equal(0)
      expect(await token.balanceOf(anotherAcc.address)).to.be.equal(990)
      expect(await token.balanceOf(owner.address)).to.be.equal(10)
    })

    it('Can not transfer if paused', async () => {
      expect(await token.connect(owner).pause()).to.be.ok
      expect(await token.paused()).to.be.equal(true)
      await expect(token.connect(acc).transfer(anotherAcc.address, 1000)).to.be.reverted

    })

    it('Can not transfer if account is frozen', async () => {
      expect(await token.connect(protector).freezeAccount(acc.address)).to.be.ok
      await expect(token.connect(acc).transfer(anotherAcc.address, 1000)).to.be.reverted
    })

    it('Can not transfer if amount exceeds balance', async () => {
      await expect(token.connect(acc).transfer(anotherAcc.address, 1000)).to.be.reverted

    })

    it('Called by owner or receiver or account exclude from fee', async () => {
      expect(await token.connect(minter).mint(acc.address, 1000)).to.be.ok
      expect(await token.connect(owner).excludeSenderFromFee(acc.address)).to.be.ok
      expect(await token.connect(acc).transfer(anotherAcc.address, 1000)).to.be.ok
      expect(await token.balanceOf(acc.address)).to.be.equal(0)
      expect(await token.balanceOf(anotherAcc.address)).to.be.equal(1000)
      expect(await token.balanceOf(owner.address)).to.be.equal(0)
    })

  })


  describe('transferFrom', async () => {
    it('normal case', async () => {
      expect(await token.connect(minter).mint(acc.address, 1000)).to.be.ok
      expect(await token.connect(acc).safeApprove(acc2.address, 0, 1000)).to.be.ok
      expect(await token.connect(acc2).transferFrom(acc.address, anotherAcc.address, 1000)).to.be.ok
      expect(await token.balanceOf(acc.address)).to.be.equal(0)
      expect(await token.balanceOf(anotherAcc.address)).to.be.equal(990)
      expect(await token.balanceOf(owner.address)).to.be.equal(10)
    })

    it('Can not transfer if paused', async () => {
      expect(await token.connect(owner).pause()).to.be.ok
      expect(await token.paused()).to.be.equal(true)
      await expect(token.connect(acc).transferFrom(acc.address, anotherAcc.address, 1000)).to.be.reverted

    })

    it('Can not transfer if caller is frozen', async () => {
      expect(await token.connect(protector).freezeAccount(anotherAcc.address)).to.be.ok
      await expect(token.connect(anotherAcc).transferFrom(acc.address, anotherAcc.address, 1000)).to.be.reverted
    })

    it('Can not transfer if sender is frozen', async () => {
      expect(await token.connect(protector).freezeAccount(acc.address)).to.be.ok
      await expect(token.connect(anotherAcc).transferFrom(acc.address, anotherAcc.address, 1000)).to.be.reverted
    })

    it('Can not transfer if caller is sender', async () => {
      await expect(token.connect(acc).transferFrom(acc.address, anotherAcc.address, 1000)).to.be.reverted
    })

    it('Can not transfer if amount exceeds balance', async () => {
      expect(await token.connect(acc).safeApprove(anotherAcc.address, 0, 1000)).to.be.ok
      await expect(token.connect(anotherAcc).transferFrom(acc.address, anotherAcc.address, 1000)).to.be.reverted

    })

    it('Called by owner or receiver or account exclude from fee', async () => {
      expect(await token.connect(minter).mint(acc.address, 1000)).to.be.ok
      expect(await token.connect(acc).safeApprove(acc2.address, 0, 1000)).to.be.ok
      expect(await token.connect(owner).excludeSenderFromFee(acc.address)).to.be.ok
      expect(await token.connect(acc2).transferFrom(acc.address, anotherAcc.address, 1000)).to.be.ok
      expect(await token.balanceOf(acc.address)).to.be.equal(0)
      expect(await token.balanceOf(anotherAcc.address)).to.be.equal(1000)
      expect(await token.balanceOf(owner.address)).to.be.equal(0)
    })
  })


  describe("freezeAccount", () => {
    it('normal case', async () => {
      expect(await token.connect(protector).freezeAccount(acc.address)).to.be.ok
      expect(await token.isFrozen(acc.address)).to.be.equal(true)
    })


    it('Can not freeze account if caller is not protector', async () => {
      await expect(token.connect(owner).freezeAccount(acc.address)).to.be.reverted
    })

    it('Can not freeze account if account is owner', async () => {
      await expect(token.connect(owner).freezeAccount(owner.address)).to.be.reverted
    })

    it('Can not freeze account if the account has already been frozen', async () => {
      expect(await token.connect(protector).freezeAccount(acc.address)).to.be.ok
      await expect(token.connect(protector).freezeAccount(acc.address)).to.be.reverted
    })
  })


  describe("unFreezeAccount", () => {
    it('normal case', async () => {
      expect(await token.connect(protector).freezeAccount(acc.address)).to.be.ok
      expect(await token.connect(protector).unFreezeAccount(acc.address)).to.be.ok
      expect(await token.isFrozen(acc.address)).to.be.equal(false)
    })


    it('Can not unfreeze account if caller is not protector', async () => {
      await expect(token.connect(owner).unFreezeAccount(acc.address)).to.be.reverted
    })

    it('Can not unfreeze account if the account has already been unfrozen', async () => {
      await expect(token.connect(protector).unFreezeAccount(acc.address)).to.be.reverted
    })
  })

  describe('transferOwnership', () => {
    it('Only proxy owner can transfer token ownership', async () => {
      await expect(token.connect(acc).transferOwnership(acc.address)).to.be.reverted
      expect(await token.connect(owner).transferOwnership(acc.address)).to.be.ok
      expect(await token.owner()).to.be.equal(acc.address)
    })

    it('Can not transfer token ownership to the current owner', async () => {
      await expect(token.connect(owner).transferOwnership(owner.address)).to.be.reverted
    })

    // it('Can not transfer token ownership to address zero', async () => {
    //   await expect(token.connect(owner).transferOwnership("0x0000000000000000000000000000000000000000")).to.be.reverted
    // })
  })


  describe('transferProxyOwnership', () => {
    it('Only proxy owner can transfer proxy ownership', async () => {
      await expect(proxy.connect(acc).transferProxyOwnership(acc.address)).to.be.reverted
      expect(await proxy.connect(owner).transferProxyOwnership(acc.address)).to.be.ok
    })

    it('Can not transfer proxy ownership to the current owner', async () => {
      await expect(proxy.connect(owner).transferProxyOwnership(owner.address)).to.be.reverted
    })

    // it('Can not transfer proxy ownership to address zero', async () => {
    //   await expect(proxy.connect(owner).transferProxyOwnership("0x0000000000000000000000000000000000000000")).to.be.reverted
    // })
  })


  describe('upgradeTo', () => {
    it('Only proxy owner can upgrade to a new implementation', async () => {
      let newToken = await Token.deploy()
      await expect(proxy.connect(acc).upgradeTo(newToken.address)).to.be.reverted
      expect(await proxy.connect(owner).upgradeTo(newToken.address)).to.be.ok
      expect(await proxy.implementation()).to.be.equal(newToken.address)
    })

    it('Can not upgradge to the current implementation', async () => {
      token = await Token.deploy()
      expect(await proxy.connect(owner).upgradeTo(token.address)).to.be.ok
      expect(await proxy.implementation()).to.be.equal(token.address)
      await expect(proxy.connect(owner).upgradeTo(token.address)).to.be.reverted
      let newToken = await Token.deploy()
      expect(await proxy.connect(owner).upgradeTo(newToken.address)).to.be.ok
      expect(await proxy.implementation()).to.be.equal(newToken.address)
    })
  })

});
