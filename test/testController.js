const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("Test Controller", async () => {
    let Proxy, proxy
    let Controller, controller
    let oracle
    let owner, addr1, addr2, addr3, addrs;

    let minCollateralRatio = 150
    let maxCollateralRatio = 200
    let lockTime = 1.21e+6
    let routerAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"

    before(async () => {
        [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();
        console.log(`Owner: ${owner.address} \nAcc1: ${addr1.address} \nAcc2: ${addr2.address}`);

        Controller = await ethers.getContractFactory("Controller")
        controller = await Controller.deploy()
        await controller.deployed()

        Proxy = await ethers.getContractFactory("Proxy")
        proxy = await Proxy.deploy(controller.address)
        await proxy.deployed()

        controller = await Controller.attach(proxy.address)
    })

    describe("initialize", async () => {
        it("Successfully initialize", async () => {
            expect(await controller.connect(owner).initialize(minCollateralRatio, maxCollateralRatio, ttl, routerAddress)).to.be.ok
        })
        it("Can only be called by owner", async () => {
            await expect(controller.connect(addr1).initialize(minCollateralRatio, maxCollateralRatio, ttl, routerAddress)).to.be.reverted
        })
        it("Can only run once", async () => {
            await expect(controller.connect(owner).initialize(minCollateralRatio, maxCollateralRatio, ttl, routerAddress)).to.be.reverted
        })
    })

    describe("setAdmin", async () => {
        it("Set successfully", async () => {
            expect(await controller.connect(owner).setAdmin(addr1.address)).to.be.ok
            expect(await controller.admins(addr1.address)).to.be.equal(true)
        })
        it("Can only be called by owner", async () => {
            await expect(controller.connect(addr1).setAdmin(addr2.address)).to.be.reverted
            expect(await controller.admins(addr2.address)).to.be.equal(false)
        })
    })

    describe("revokeAdmin", async () => {
        it("Set successfully", async () => {
            expect(await controller.connect(owner).revokeAdmin(addr1.address)).to.be.ok
            expect(await controller.admins(addr1.address)).to.be.equal(false)
        })
        it("Can only be called by owner", async () => {
            expect(await controller.connect(owner).setAdmin(addr1.address)).to.be.ok
            await expect(controller.connect(addr1).revokeAdmin(addr1.address)).to.be.reverted
            expect(await controller.admins(addr1.address)).to.be.equal(true)
        })
    })

    describe("setRoyaltyFeeRatio", async () => {
        it("Set successfully", async () => {
            expect(await controller.connect(owner).setRoyaltyFeeRatio(80)).to.be.ok
            expect(await controller.royaltyFeeRatio()).to.be.equal(80)
        })
        it("Can only be called by owner", async () => {
            await expect(controller.connect(addr1).setRoyaltyFeeRatio(50)).to.be.reverted
            expect(await controller.royaltyFeeRatio()).to.be.equal(80)
        })
    })

    describe("setRecieverAddress", async () => {
        it("Set successfully", async () => {
            expect(await controller.connect(owner).setRecieverAddress(owner.address)).to.be.ok
            expect(await controller.recieverAddress()).to.be.equal(owner.address)
        })
        it("Can only be called by owner", async () => {
            await expect(controller.connect(addr1).setRecieverAddress(addr2.address)).to.be.reverted
            expect(await controller.recieverAddress()).to.be.equal(owner.address)
        })
    })

    describe("setMinCollateralRatio", async () => {
        it("Set successfully", async () => {
            expect(await controller.connect(owner).setMinCollateralRatio(200)).to.be.ok
            expect(await controller.minCollateralRatio()).to.be.equal(200)

            expect(await controller.connect(owner).setMinCollateralRatio(150)).to.be.ok
            expect(await controller.minCollateralRatio()).to.be.equal(150)
        })

        it("Only owner can set", async () => {
            await expect(controller.connect(addr1).setMinCollateralRatio(200)).to.be.reverted
            expect(await controller.minCollateralRatio()).to.be.equal(150)
        })
    })

    describe("setMaxCollateralRatio", async () => {
        it("Set successfully", async () => {
            expect(await controller.connect(owner).setMaxCollateralRatio(230)).to.be.ok
            expect(await controller.maxCollateralRatio()).to.be.equal(230)

            expect(await controller.connect(owner).setMaxCollateralRatio(200)).to.be.ok
            expect(await controller.maxCollateralRatio()).to.be.equal(200)
        })

        it("Only owner can set", async () => {
            await expect(controller.connect(addr1).setMaxCollateralRatio(300)).to.be.reverted
            expect(await controller.maxCollateralRatio()).to.be.equal(200)
        })
    })

    describe("setRouter", async () => {
        it("Set successfully", async () => {
            expect(await controller.connect(owner).setRouter("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC")).to.be.ok
            expect(await controller.router()).to.be.equal("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC")

            expect(await controller.connect(owner).setRouter("0x6eF03abAeee4b3937cBc6459986a993a6ce4BFD2")).to.be.ok
            expect(await controller.router()).to.be.equal("0x6eF03abAeee4b3937cBc6459986a993a6ce4BFD2")
        })

        it("Only owner can set", async () => {
            await expect(controller.connect(addr1).setRouter("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC")).to.be.reverted
            expect(await controller.router()).to.be.equal("0x6eF03abAeee4b3937cBc6459986a993a6ce4BFD2")
        })
    })

    describe("setTTL", async () => {
        it("Set successfully", async () => {
            expect(await controller.connect(owner).setTTL(96400)).to.be.ok
            expect(await controller.ttl()).to.be.equal(96400)

            expect(await controller.connect(owner).setTTL(86400)).to.be.ok
            expect(await controller.ttl()).to.be.equal(86400)
        })

        it("Only owner can set", async () => {
            await expect(controller.connect(addr1).setTTL(12341324)).to.be.reverted
            expect(await controller.ttl()).to.be.equal(86400)
        })
    })

    describe("setLockTime", async () => {
        it("Set successfully", async () => {
            expect(await controller.connect(owner).setLockTime(300)).to.be.ok
            expect(await controller.lockTime()).to.be.equal(300)

            expect(await controller.connect(owner).setLockTime(1.21e+6)).to.be.ok
            expect(await controller.lockTime()).to.be.equal(1.21e+6)
        })

        it("Only owner can set", async () => {
            await expect(controller.connect(addr1).setLockTime(1)).to.be.reverted
            expect(await controller.lockTime()).to.be.equal(1.21e+6)
        })

        it("Lock time must be at least 5 minutes", async () => {
            await expect(controller.connect(addr1).setLockTime(299)).to.be.reverted
            expect(await controller.lockTime()).to.be.equal(1.21e+6)
        })
    })

    describe("setMintContract", async () => {
        it("Set successfully", async () => {
            expect(await controller.connect(owner).setMintContract("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC")).to.be.ok
            expect(await controller.mintContract()).to.be.equal("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC")

            expect(await controller.connect(owner).setMintContract("0x6eF03abAeee4b3937cBc6459986a993a6ce4BFD2")).to.be.ok
            expect(await controller.mintContract()).to.be.equal("0x6eF03abAeee4b3937cBc6459986a993a6ce4BFD2")
        })

        it("Only owner can set", async () => {
            await expect(controller.connect(addr1).setMintContract("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC")).to.be.reverted
            expect(await controller.mintContract()).to.be.equal("0x6eF03abAeee4b3937cBc6459986a993a6ce4BFD2")
        })
    })

    describe("setLimitOfferContract", async () => {
        it("Set successfully", async () => {
            expect(await controller.connect(owner).setLimitOfferContract("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC")).to.be.ok
            expect(await controller.limitOfferContract()).to.be.equal("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC")

            expect(await controller.connect(owner).setLimitOfferContract("0x6eF03abAeee4b3937cBc6459986a993a6ce4BFD2")).to.be.ok
            expect(await controller.limitOfferContract()).to.be.equal("0x6eF03abAeee4b3937cBc6459986a993a6ce4BFD2")
        })

        it("Only owner can set", async () => {
            await expect(controller.connect(addr1).setLimitOfferContract("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC")).to.be.reverted
            expect(await controller.limitOfferContract()).to.be.equal("0x6eF03abAeee4b3937cBc6459986a993a6ce4BFD2")
        })
    })

    describe("setDiscountRate", async () => {
        it("Set successfully", async () => {
            expect(await controller.connect(owner).setDiscountRate("0x6beD53b6a43E3Df3F2ee0E081A79eA2b353CBbe6",10)).to.be.ok
            expect(await controller.discountRates("0x6beD53b6a43E3Df3F2ee0E081A79eA2b353CBbe6")).to.be.equal(10)
        })

        it("Only owner can set", async () => {
            await expect(controller.connect(addr1).setDiscountRate("0x6beD53b6a43E3Df3F2ee0E081A79eA2b353CBbe6",20)).to.be.reverted
            expect(await controller.discountRates("0x6beD53b6a43E3Df3F2ee0E081A79eA2b353CBbe6")).to.be.equal(10)
        })
    })

    describe("registerIDOToken", async () => {
        let Pool, pool
        let Oracle

        beforeEach(async () => {
            Pool = await ethers.getContractFactory("MockPair")
            pool = await Pool.deploy("0x38E3089e83197603D3BeC5bF5D2c157f2f2d41CC", "0x6beD53b6a43E3Df3F2ee0E081A79eA2b353CBbe6")
            await pool.deployed()

            Oracle = await ethers.getContractFactory("Oracle")
            oracle = await Oracle.deploy(controller.address)
            await oracle.deployed()

            await controller.connect(owner).registerCollateralAsset("0x38E3089e83197603D3BeC5bF5D2c157f2f2d41CC",true)
        })

        it("Only admin can call", async () => {
            await expect(controller.connect(addr2).registerIDOToken("0x6beD53b6a43E3Df3F2ee0E081A79eA2b353CBbe6",oracle.address,pool.address,"0x38E3089e83197603D3BeC5bF5D2c157f2f2d41CC",20)).to.be.reverted
        })

        it("Register successfully", async () => {
            expect(await controller.connect(owner).registerIDOToken("0x6beD53b6a43E3Df3F2ee0E081A79eA2b353CBbe6",oracle.address,pool.address,"0x38E3089e83197603D3BeC5bF5D2c157f2f2d41CC",20)).to.be.ok
        })

        it("Duplicate Token address", async () => {
            await expect(controller.connect(owner).registerIDOToken("0x38E3089e83197603D3BeC5bF5D2c157f2f2d41CC",oracle.address,pool.address,"0x38E3089e83197603D3BeC5bF5D2c157f2f2d41CC",20)).to.be.reverted
        })

        it("Token is already registered", async () => {
            await expect(controller.connect(owner).registerIDOToken("0x6beD53b6a43E3Df3F2ee0E081A79eA2b353CBbe6",oracle.address,pool.address,"0x38E3089e83197603D3BeC5bF5D2c157f2f2d41CC",20)).to.be.reverted
        })

        it("Invalid colateral token", async () => {
            await expect(controller.connect(owner).registerIDOToken("0x38E3089e83197603D3BeC5bF5D2c157f2f2d41CC",oracle.address,pool.address,"0x6beD53b6a43E3Df3F2ee0E081A79eA2b353CBbe6",20)).to.be.reverted
        })

        it("Missing token address", async () => {
            await expect(controller.connect(owner).registerIDOToken("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",oracle.address,pool.address,"0x38E3089e83197603D3BeC5bF5D2c157f2f2d41CC",20)).to.be.reverted
        })

        it("Missing collateral address", async () => {
            await pool.connect(owner).setToken0("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC")
            await expect(controller.connect(owner).registerIDOToken("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",oracle.address,pool.address,"0x38E3089e83197603D3BeC5bF5D2c157f2f2d41CC",20)).to.be.reverted
        })
    })

    describe("unregisterToken", async () => {
        beforeEach(async () => {
            Oracle = await ethers.getContractFactory("Oracle")
            oracle = await Oracle.deploy(controller.address)
            await oracle.deployed()

            let registering = await controller.connect(owner).registerCollateralAsset("0x38E3089e83197603D3BeC5bF5D2c157f2f2d41CC",true)
            await registering.wait()

        })

        it("Unregister Successfully", async () => {
            expect(await controller.connect(owner).unregisterToken("0x6beD53b6a43E3Df3F2ee0E081A79eA2b353CBbe6")).to.be.ok
        })

        it("Only admin can call", async () => {
            await expect(controller.connect(addr2).unregisterToken("0x6beD53b6a43E3Df3F2ee0E081A79eA2b353CBbe6")).to.be.reverted
        })

        it("Token have not been registered", async () => {
            await expect(controller.connect(owner).unregisterToken("0x6beD53b6a43E3Df3F2ee0E081A79eA2b353CBbe6")).to.be.reverted
        })
    })

    describe("updateIDOToken", async () => {
        let oracle_new, pool_new;
        before(async () => {
            Pool = await ethers.getContractFactory("MockPair")
            pool = await Pool.deploy("0x38E3089e83197603D3BeC5bF5D2c157f2f2d41CC", "0x6beD53b6a43E3Df3F2ee0E081A79eA2b353CBbe6")
            await pool.deployed()

            Oracle = await ethers.getContractFactory("Oracle")
            oracle = await Oracle.deploy(controller.address)
            await oracle.deployed()

            await controller.connect(owner).registerCollateralAsset("0x38E3089e83197603D3BeC5bF5D2c157f2f2d41CC",true)

            await controller.connect(owner).registerIDOToken("0x6beD53b6a43E3Df3F2ee0E081A79eA2b353CBbe6",oracle.address,pool.address,"0x38E3089e83197603D3BeC5bF5D2c157f2f2d41CC",20)

            Pool_new = await ethers.getContractFactory("MockPair")
            pool_new = await Pool_new.deploy("0x38E3089e83197603D3BeC5bF5D2c157f2f2d41CC", "0x6beD53b6a43E3Df3F2ee0E081A79eA2b353CBbe6")
            await pool_new.deployed()

            Oracle_new = await ethers.getContractFactory("Oracle")
            oracle_new = await Oracle_new.deploy(controller.address)
            await oracle_new.deployed()
        })

        it("Update successfully", async () => {
            expect(await controller.connect(owner).updateIDOToken("0x6beD53b6a43E3Df3F2ee0E081A79eA2b353CBbe6",oracle_new.address,pool_new.address,"0x38E3089e83197603D3BeC5bF5D2c157f2f2d41CC")).to.be.ok

            oracle = oracle_new
        })

        it("Only admin can call", async () => {
            await expect(controller.connect(addr2).updateIDOToken("0x6beD53b6a43E3Df3F2ee0E081A79eA2b353CBbe6",oracle_new.address,pool_new.address,"0x38E3089e83197603D3BeC5bF5D2c157f2f2d41CC")).to.be.reverted
        })

        it("Token have not been registered", async () => {
            await expect(controller.connect(owner).updateIDOToken("0x38E3089e83197603D3BeC5bF5D2c157f2f2d41CC",oracle_new.address,pool_new.address,"0x38E3089e83197603D3BeC5bF5D2c157f2f2d41CC")).to.be.reverted
        })

        it("Invalid collateral token", async () => {
            await expect(controller.connect(owner).updateIDOToken("0x6beD53b6a43E3Df3F2ee0E081A79eA2b353CBbe6",oracle_new.address,pool_new.address,"0x6beD53b6a43E3Df3F2ee0E081A79eA2b353CBbe6")).to.be.reverted
        })
    })

    describe("registerCollateralAsset", async () => {
        it("Register successfully", async () => {
            expect(await controller.connect(owner).registerCollateralAsset("0x38E3089e83197603D3BeC5bF5D2c157f2f2d41CC", true)).to.be.ok
            expect(await controller.acceptedCollateral("0x38E3089e83197603D3BeC5bF5D2c157f2f2d41CC")).to.be.equal(true)
        })

        it("Only owner can call", async () => {
            await expect(controller.connect(addr1).registerCollateralAsset("0x38E3089e83197603D3BeC5bF5D2c157f2f2d41CC", true)).to.be.reverted
        })
    })

    describe("updatePrices", async () => {
        it("Update prices successfully", async () => {
            expect(await controller.connect(addr1).updatePrices(["0x6beD53b6a43E3Df3F2ee0E081A79eA2b353CBbe6"], [10])).to.emit(controller, "UpdatePrices").withArgs(["0x6beD53b6a43E3Df3F2ee0E081A79eA2b353CBbe6"], [10])
            expect((await oracle.getTargetValue())[0]).to.be.equal(10)
            expect((await controller.getOraclePrices(["0x6beD53b6a43E3Df3F2ee0E081A79eA2b353CBbe6"]))[0][0]).to.be.equal(10)
        })

        it("Only admin can call", async () => {
            await expect(controller.connect(addr2).updatePrices(["0x6beD53b6a43E3Df3F2ee0E081A79eA2b353CBbe6"], [10])).to.be.reverted
        })
    })
})