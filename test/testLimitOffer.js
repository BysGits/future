const { ethers } = require("hardhat");
const { expect } = require("chai");

Number.prototype.before = function () {
    var value = parseInt(this.toString().split(".")[0], 10);//before
    return value ? value : 0;
}
  
Number.prototype.after = function () {
    var value = parseInt(this.toString().split(".")[1], 10);//after
    return value ? value : 0;
}

var increaseBlockTime = async (time) => {
    await ethers.provider.send("evm_increaseTime", [time])
}

describe("Test Limit Offer", async () => {
    let ProxyController, proxyController, ProxyMinter, proxyMinter
    let Controller, controller
    let Minter, minter
    let UToken, uToken
    let Eurb, eurb
    let Pool, pool
    let Router, router
    let Offer, offer

    let owner, addr1, addr2, signerAddr, addrs;

    let minCollateralRatio = 150
    let maxCollateralRatio = 200
    let royaltyFeeRatio = 80
    let lockTime = 1.21e+6

    before(async () => {
        [owner, addr1, addr2, signerAddr, ...addrs] = await ethers.getSigners();
        console.log(`Owner: ${owner.address} \nAcc1: ${addr1.address} \nAcc2: ${addr2.address}`);

        Router = await ethers.getContractFactory("MockRouter1_5")
        router = await Router.deploy()
        await router.deployed()

        Controller = await ethers.getContractFactory("Controller")
        controller = await Controller.deploy()
        await controller.deployed()

        Eurb = await ethers.getContractFactory("EURB")
        eurb = await Eurb.deploy()
        await eurb.deployed()

        setting = await eurb.setDecimals(18)
        await setting.wait()

        setting = await eurb.setFeePercentage(0)
        await setting.wait()

        setting = await eurb.setFeeReceiver(owner.address)
        await setting.wait()

        setting = await eurb.grantRole("0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6", owner.address)
        await setting.wait()

        setting = await eurb.mint(owner.address, 1000000)
        await setting.wait()

        UToken = await ethers.getContractFactory("MockToken")
        uToken = await UToken.deploy("uToken","uToken", 1000000, controller.address)
        await uToken.deployed()

        Minter = await ethers.getContractFactory("Minter")
        minter = await Minter.deploy()
        await minter.deployed()

        Offer = await ethers.getContractFactory("LimitOffer")
        offer = await Offer.deploy()
        await offer.deployed()

        ProxyController = await ethers.getContractFactory("Proxy")
        proxyController = await ProxyController.deploy(controller.address)
        await proxyController.deployed()

        ProxyMinter = await ethers.getContractFactory("Proxy")
        proxyMinter = await ProxyMinter.deploy(minter.address)
        await proxyMinter.deployed()

        ProxyOffer = await ethers.getContractFactory("Proxy")
        proxyOffer = await ProxyOffer.deploy(offer.address)
        await proxyOffer.deployed()

        controller = await Controller.attach(proxyController.address)
        minter = await Minter.attach(proxyMinter.address)
        offer = await Offer.attach(proxyOffer.address)

        let mint = await eurb.mint(addr1.address, 1000000)
        await mint.wait()

        mint = await eurb.mint(addr2.address, 1000000)
        await mint.wait()

        mint = await uToken.mint(addr1.address, 1000000)
        await mint.wait()

        mint = await uToken.mint(addr2.address, 1000000)
        await mint.wait()

        let approve = await eurb.connect(owner).approve(offer.address, 10000000000)
        await approve.wait()
        
        approve = await eurb.connect(addr1).approve(offer.address, 10000000000)
        await approve.wait()

        approve = await eurb.connect(addr2).approve(offer.address, 10000000000)
        await approve.wait()

        approve = await uToken.connect(owner).approve(offer.address, 10000000000)
        await approve.wait()

        approve = await uToken.connect(addr1).approve(offer.address, 10000000000)
        await approve.wait()

        approve = await uToken.connect(addr2).approve(offer.address, 10000000000)
        await approve.wait()

        approve = await eurb.connect(owner).approve(router.address, 10000000000)
        await approve.wait()
        
        approve = await eurb.connect(addr1).approve(router.address, 10000000000)
        await approve.wait()

        approve = await eurb.connect(addr2).approve(router.address, 10000000000)
        await approve.wait()

        approve = await uToken.connect(owner).approve(router.address, 10000000000)
        await approve.wait()

        approve = await uToken.connect(addr1).approve(router.address, 10000000000)
        await approve.wait()

        approve = await uToken.connect(addr2).approve(router.address, 10000000000)
        await approve.wait()

        let createPair = await router.addLiquidity(50000,10000,eurb.address, uToken.address)
        await createPair.wait()

        let Pool = await ethers.getContractFactory("MockPool")
        pool = await Pool.attach(await router.poolByA(eurb.address, uToken.address))
        await pool.deployed()

        console.log("Pool owner: " + await pool.owner());

        let initializing = await controller.connect(owner).initialize(minCollateralRatio, maxCollateralRatio, lockTime, royaltyFeeRatio, router.address, owner.address, signerAddr.address)
        await initializing.wait()

        let setLockTime = await controller.connect(owner).setLockTime(lockTime)
        await setLockTime.wait()

        let setRoyaltyFeeRatio = await controller.connect(owner).setRoyaltyFeeRatio(0)
        await setRoyaltyFeeRatio.wait()

        let setMintContract = await controller.connect(owner).setMintContract(minter.address)
        await setMintContract.wait()

        let setLimitOfferContract = await controller.connect(owner).setLimitOfferContract(offer.address)
        await setLimitOfferContract.wait()

        let register = await controller.connect(owner).registerCollateralAsset(eurb.address, true)
        await register.wait()

        register = await controller.connect(owner).registerIDOToken(uToken.address, pool.address, eurb.address, 10)
        await register.wait()
    })

    describe("setControllerAddress", async () => {
        it("Only owner can get amount to claim", async () => {
            expect(await offer.connect(owner).getAmountToClaim()).to.be.equal(0)
            expect(await offer.connect(owner).getAmountToClaim()).to.be.ok
            await expect(offer.connect(addr1).getAmountToClaim()).to.be.reverted
        })
        it("Set successfully", async () => {
            expect(await offer.connect(owner).setControllerAddress(controller.address)).to.be.ok
            expect(await offer.controllerAddress()).to.be.equal(controller.address)
        })

        it("Only owner can call", async () => {
            new_controller = await Controller.deploy()
            await new_controller.deployed()
            await expect(offer.connect(addr1).setControllerAddress(new_controller.address)).to.be.reverted
            expect(await offer.controllerAddress()).to.be.equal(controller.address)
        })
    })

    describe("offerBuy", async () => {
        it("Offer successfully", async () => {
            expect(await offer.connect(addr1).offerBuy(uToken.address, 100, 400, "0x11")).to.emit(offer, "Offer").withArgs(addr1.address, uToken.address, "0x11", 100, 400, ((new Date().getTime() )/ 1000).before())
            expect((await offer.orders("0x11")).offerCollateralAmount).to.be.equal(400)
            expect((await offer.orders("0x11")).offerUAssetAmount).to.be.equal(100)
            expect((await offer.orders("0x11")).uAssetAddress).to.be.equal(uToken.address)
            expect((await offer.orders("0x11")).userAddress).to.be.equal(addr1.address)
            expect(await eurb.balanceOf(addr1.address)).to.be.equal(999600)
        })

        it("Still being offered to buy", async () => {
            await expect(offer.connect(addr1).offerBuy(uToken.address, 100, 300, "0x11")).to.be.reverted
            expect((await offer.orders("0x11")).offerCollateralAmount).to.be.equal(400)
            expect((await offer.orders("0x11")).offerUAssetAmount).to.be.equal(100)
            expect((await offer.orders("0x11")).uAssetAddress).to.be.equal(uToken.address)
            expect((await offer.orders("0x11")).userAddress).to.be.equal(addr1.address)
            expect(await eurb.balanceOf(addr1.address)).to.be.equal(999600)
        })
    })

    describe("offerSell", async () => {
        it("Offer successfully", async () => {
            expect(await offer.connect(addr1).offerSell(uToken.address, 100, 700, "0x22")).to.emit(offer, "Offer").withArgs(addr1.address, uToken.address, "0x22", 100, 700, ((new Date().getTime() )/ 1000).before())
            expect((await offer.orders("0x22")).offerCollateralAmount).to.be.equal(700)
            expect((await offer.orders("0x22")).offerUAssetAmount).to.be.equal(100)
            expect((await offer.orders("0x22")).uAssetAddress).to.be.equal(uToken.address)
            expect((await offer.orders("0x22")).userAddress).to.be.equal(addr1.address)
            expect(await uToken.balanceOf(addr1.address)).to.be.equal(999900)
        })

        it("Still being offered to sell", async () => {
            await expect(offer.connect(addr1).offerSell(uToken.address, 100, 800, "0x22")).to.be.reverted
            expect((await offer.orders("0x22")).offerCollateralAmount).to.be.equal(700)
            expect((await offer.orders("0x22")).offerUAssetAmount).to.be.equal(100)
            expect((await offer.orders("0x22")).uAssetAddress).to.be.equal(uToken.address)
            expect((await offer.orders("0x22")).userAddress).to.be.equal(addr1.address)
            expect(await uToken.balanceOf(addr1.address)).to.be.equal(999900)
        })
    })

    describe("buyNow", async () => {
        var uTokenBalance
        it("Buy successfully", async () => {
            uTokenBalance = parseInt(await uToken.balanceOf(addr1.address)) + parseInt((await offer.orders("0x11")).offerCollateralAmount) / 5
            uTokenBalance = parseInt(uTokenBalance)
            expect(await offer.connect(owner).buyNow("2000000000",0, "0x11")).to.be.ok
            expect((await offer.orders("0x11")).offerCollateralAmount).to.be.equal(0)
            expect((await offer.orders("0x11")).offerUAssetAmount).to.be.equal(0)
            expect(await eurb.balanceOf(addr1.address)).to.be.equal(999600)
            expect(await uToken.balanceOf(addr1.address)).to.be.equal(uTokenBalance)
        })

        it("Can not buy again with the same id", async () => {
            await expect(offer.connect(owner).buyNow("2000000000",0, "0x11")).to.be.reverted
            expect(await uToken.balanceOf(addr1.address)).to.be.equal(uTokenBalance)
        })

        it("Only admin can call", async () => {
            await expect(offer.connect(addr1).buyNow("2000000000",0, "0x11")).to.be.reverted
            expect(await uToken.balanceOf(addr1.address)).to.be.equal(uTokenBalance)
        })
    })

    describe("sellNow", async () => {
        var eurbBalance
        it("Sell successfully", async () => {
            eurbBalance = parseInt(await eurb.balanceOf(addr1.address)) + parseInt((await offer.orders("0x22")).offerUAssetAmount * 5)
            eurbBalance = parseInt(eurbBalance)
            expect(await offer.connect(owner).sellNow("2000000000",0, "0x22")).to.be.ok
            expect((await offer.orders("0x22")).offerCollateralAmount).to.be.equal(0)
            expect((await offer.orders("0x22")).offerUAssetAmount).to.be.equal(0)
            expect(await eurb.balanceOf(addr1.address)).to.be.equal(eurbBalance)
            expect(await uToken.balanceOf(addr1.address)).to.be.equal(999980)
        })

        it("Can not sell again with the same id", async () => {
            await expect(offer.connect(owner).sellNow("2000000000",0, "0x22")).to.be.reverted
            expect(await eurb.balanceOf(addr1.address)).to.be.equal(eurbBalance)
        })

        it("Only admin can call", async () => {
            await expect(offer.connect(addr1).sellNow("2000000000",0, "0x22")).to.be.reverted
            expect(await eurb.balanceOf(addr1.address)).to.be.equal(eurbBalance)
        })
    })

    describe("buy", async () => {
        var uTokenBalance
        before(async () => {
            await offer.connect(addr1).offerBuy(uToken.address, 100, 400, "0x1111")
            await offer.connect(addr1).offerBuy(uToken.address, 100, 400, "0x1112")
        })

        it("Buy successfully", async () => {
            uTokenBalance = parseInt(await uToken.balanceOf(addr1.address)) + (parseInt((await offer.orders("0x1111")).offerCollateralAmount) / 5) * 2
            uTokenBalance = parseInt(uTokenBalance)
            expect(await offer.connect(owner).buy("2000000000",[0,0], ["0x1111", "0x1112"])).to.be.ok
            expect(await eurb.balanceOf(addr1.address)).to.be.equal(999300)
            expect(await uToken.balanceOf(addr1.address)).to.be.equal(uTokenBalance)
        })

        it("Only admin can call", async () => {
            await expect(offer.connect(addr1).buy("2000000000",[0,0], ["0x1111", "0x1112"]))
            expect(await uToken.balanceOf(addr1.address)).to.be.equal(uTokenBalance)
        })

        it("Can not buy again with the same ids", async () => {
            await expect(offer.connect(owner).buy("2000000000",[0,0], ["0x1111", "0x1112"])).to.be.reverted
            expect(await uToken.balanceOf(addr1.address)).to.be.equal(uTokenBalance)
        })
    })


    describe("sell", async () => {
        var eurbBalance
        var uTokenBalance
        before(async () => {
            uTokenBalance = parseInt(await uToken.balanceOf(addr1.address)) - 200
            await offer.connect(addr1).offerSell(uToken.address, 100, 400, "0x2211")
            await offer.connect(addr1).offerSell(uToken.address, 100, 400, "0x2212")
        })

        it("Sell successfully", async () => {
            eurbBalance = parseInt(await eurb.balanceOf(addr1.address)) + parseInt((await offer.orders("0x2211")).offerUAssetAmount * 5) * 2
            eurbBalance = parseInt(eurbBalance)
            expect(await offer.connect(owner).sell("2000000000",[0,0], ["0x2211", "0x2212"])).to.be.ok
            expect(await eurb.balanceOf(addr1.address)).to.be.equal(eurbBalance)
            expect(await uToken.balanceOf(addr1.address)).to.be.equal(uTokenBalance)
        })

        it("Only admin can call", async () => {
            await expect(offer.connect(addr1).sell("2000000000",[0,0], ["0x2211", "0x2212"]))
            expect(await eurb.balanceOf(addr1.address)).to.be.equal(eurbBalance)
        })

        it("Can not sell again with the same ids", async () => {
            await expect(offer.connect(owner).sell("2000000000",[0,0], ["0x1111", "0x1112"])).to.be.reverted
            expect(await eurb.balanceOf(addr1.address)).to.be.equal(eurbBalance)
        })
    })

    describe("withdrawBuy", async () => {
        var eurbBalance
        var uTokenBalance
        before(async () => {
            eurbBalance = parseInt(await eurb.balanceOf(addr1.address)) - 400
            uTokenBalance = parseInt(await uToken.balanceOf(addr1.address))
            await offer.connect(addr1).offerBuy(uToken.address, 100, 400, "0x1113")
            await offer.connect(addr1).offerBuy(uToken.address, 100, 400, "0x1114")

            await offer.connect(owner).buy("2000000000",[0], ["0x1114"])
        })

        it("Withdraw successfully", async () => {
            expect(await offer.connect(addr1).withDrawBuy("0x1113")).to.be.ok
            expect(await eurb.balanceOf(addr1.address)).to.be.equal(eurbBalance)
            expect((await offer.orders("0x1113")).offerCollateralAmount).to.be.equal(0)
            expect((await offer.orders("0x1113")).offerUAssetAmount).to.be.equal(0)
        })

        it("Caller is not the one offered", async () => {
            await expect(offer.connect(addr2).withDrawBuy("0x1113")).to.be.reverted
            expect(await eurb.balanceOf(addr1.address)).to.be.equal(eurbBalance)
            expect((await offer.orders("0x1113")).offerCollateralAmount).to.be.equal(0)
            expect((await offer.orders("0x1113")).offerUAssetAmount).to.be.equal(0)
        })

        it("No offer to be withdrawn", async () => {
            await expect(offer.connect(addr1).withDrawBuy("0x1113")).to.be.reverted
            await expect(offer.connect(addr1).withDrawBuy("0x1114")).to.be.reverted
            expect(await eurb.balanceOf(addr1.address)).to.be.equal(eurbBalance)
            expect((await offer.orders("0x1113")).offerCollateralAmount).to.be.equal(0)
            expect((await offer.orders("0x1114")).offerCollateralAmount).to.be.equal(0)
        })
    })

    describe("withdrawSell", async () => {
        var eurbBalance
        var uTokenBalance
        before(async () => {
            eurbBalance = parseInt(await eurb.balanceOf(addr1.address))
            uTokenBalance = parseInt(await uToken.balanceOf(addr1.address)) - 100
            await offer.connect(addr1).offerSell(uToken.address, 100, 400, "0x2213")
            await offer.connect(addr1).offerSell(uToken.address, 100, 400, "0x2214")

            await offer.connect(owner).sell("2000000000",[0], ["0x2214"])
        })

        it("Withdraw successfully", async () => {
            expect(await offer.connect(addr1).withDrawSell("0x2213")).to.be.ok
            expect(await uToken.balanceOf(addr1.address)).to.be.equal(uTokenBalance)
            expect((await offer.orders("0x2213")).offerCollateralAmount).to.be.equal(0)
            expect((await offer.orders("0x2213")).offerUAssetAmount).to.be.equal(0)
        })

        it("Caller is not the one offered", async () => {
            await expect(offer.connect(addr2).withDrawSell("0x2213")).to.be.reverted
            expect(await uToken.balanceOf(addr1.address)).to.be.equal(uTokenBalance)
            expect((await offer.orders("0x2213")).offerCollateralAmount).to.be.equal(0)
            expect((await offer.orders("0x2213")).offerUAssetAmount).to.be.equal(0)
        })

        it("No offer to be withdrawn", async () => {
            await expect(offer.connect(addr1).withDrawSell("0x2213")).to.be.reverted
            await expect(offer.connect(addr1).withDrawSell("0x2214")).to.be.reverted
            expect(await uToken.balanceOf(addr1.address)).to.be.equal(uTokenBalance)
            expect((await offer.orders("0x2213")).offerUAssetAmount).to.be.equal(0)
            expect((await offer.orders("0x2214")).offerUAssetAmount).to.be.equal(0)
        })
    })


    describe("claim", async () => {
        var eurbBalance, unknownBalance
        before(async () => {
            eurbBalance = parseInt(await eurb.balanceOf(offer.address)) + parseInt(await eurb.balanceOf(owner.address))
            unknownBalance = parseInt(await eurb.balanceOf(addr1.address))
        })

        it("Claim successfully", async () => {
            expect(await offer.connect(owner).claim(eurb.address)).to.be.ok
            expect(await eurb.balanceOf(owner.address)).to.be.equal(eurbBalance)
            expect(await eurb.balanceOf(offer.address)).to.be.equal(0)
        })

        it("Only owner can call", async () => {
            await expect(offer.connect(addr1).claim(eurb.address)).to.be.reverted
            expect(await eurb.balanceOf(addr1.address)).to.be.equal(unknownBalance)
            expect(await eurb.balanceOf(offer.address)).to.be.equal(0)
        })
    })


})