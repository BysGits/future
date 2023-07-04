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

describe("Test Minter", async () => {
    let ProxyController, proxyController, ProxyMinter, proxyMinter
    let Controller, controller
    let Minter, minter
    let UToken, uToken
    let Eurb, eurb
    let Pool, pool
    let Router, router
    let Oracle, oracle

    let owner, addr1, addr2, addr3, addrs;

    let minCollateralRatio = 150
    let maxCollateralRatio = 200
    let ttl = 86400
    let lockTime = 1.21e+6

    before(async () => {
        [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();
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

        Oracle = await ethers.getContractFactory("Oracle")
        oracle = await Oracle.deploy(controller.address)
        await oracle.deployed()

        Minter = await ethers.getContractFactory("Minter")
        minter = await Minter.deploy()
        await minter.deployed()

        ProxyController = await ethers.getContractFactory("Proxy")
        proxyController = await ProxyController.deploy(controller.address)
        await proxyController.deployed()

        ProxyMinter = await ethers.getContractFactory("Proxy")
        proxyMinter = await ProxyMinter.deploy(minter.address)
        await proxyMinter.deployed()

        controller = await Controller.attach(proxyController.address)
        await controller.deployed()
        minter = await Minter.attach(proxyMinter.address)
        await minter.deployed()

        let mint = await eurb.mint(addr1.address, 1000000)
        await mint.wait()

        mint = await eurb.mint(addr2.address, 1000000)
        await mint.wait()

        mint = await uToken.mint(addr1.address, 1000000)
        await mint.wait()

        mint = await uToken.mint(addr2.address, 1000000)
        await mint.wait()

        let approve = await eurb.connect(owner).approve(minter.address, 10000000000)
        await approve.wait()
        
        approve = await eurb.connect(addr1).approve(minter.address, 10000000000)
        await approve.wait()

        approve = await eurb.connect(addr2).approve(minter.address, 10000000000)
        await approve.wait()

        approve = await uToken.connect(owner).approve(minter.address, 10000000000)
        await approve.wait()

        approve = await uToken.connect(addr1).approve(minter.address, 10000000000)
        await approve.wait()

        approve = await uToken.connect(addr2).approve(minter.address, 10000000000)
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

        console.log("Router "+ router.address);
        console.log("Pool created: " + await router.poolByA(eurb.address, uToken.address))

        let Pool = await ethers.getContractFactory("MockPool")
        pool = await Pool.attach(await router.poolByA(eurb.address, uToken.address))
        await pool.deployed()

        let initializing = await controller.connect(owner).initialize(minCollateralRatio, maxCollateralRatio, ttl, router.address)
        await initializing.wait()

        let setLockTime = await controller.connect(owner).setLockTime(lockTime)
        await setLockTime.wait()

        let setMintContract = await controller.connect(owner).setMintContract(minter.address)
        await setMintContract.wait()

        let register = await controller.connect(owner).registerCollateralAsset(eurb.address, true)
        await register.wait()

        register = await controller.connect(owner).registerIDOToken(uToken.address, oracle.address, pool.address, eurb.address, 10)
        await register.wait()

        let updatePrice = await oracle.connect(owner).update(5)
        await updatePrice.wait()
        console.log("Target price: " + (await oracle.getTargetValue())[0])
    })

    describe("setControllerAddress", async () => {
        it("Set successfully", async () => {
            expect(await minter.connect(owner).setControllerAddress(controller.address)).to.be.ok
            expect(await minter.controllerAddress()).to.be.equal(controller.address)
        })

        it("Only owner can call", async () => {
            await expect(minter.connect(addr1).setControllerAddress("0x6beD53b6a43E3Df3F2ee0E081A79eA2b353CBbe6")).to.be.reverted
            expect(await minter.controllerAddress()).to.be.equal(controller.address)
        })
    })

    describe("addMoreCollateralAmount", async () => {
        it("Add successfully", async () => {
            expect(await minter.connect(owner).addMoreCollateralAmount(uToken.address, 10, "0x99")).to.be.ok
            expect(await minter.collateralBalances("0x99")).to.be.equal(10)
        })

        it("Only admin can call", async () => {
            await expect(minter.connect(addr1).addMoreCollateralAmount(uToken.address, 10, "0x99")).to.be.reverted
            expect(await minter.collateralBalances("0x99")).to.be.equal(10)
        })
    })

    describe("borrow", async () => {
        it("Borrow successfully", async () => {
            expect(await minter.connect(addr1).borrow(uToken.address, 100, 1000, "0x11")).to.be.ok
            expect(await minter.borrowBalances("0x11")).to.be.equal(100)
            expect(await minter.collateralBalances("0x11")).to.be.equal(1000)
            expect(await minter.accounts("0x11")).to.be.equal(addr1.address)
            expect(await minter.typeBorrow("0x11")).to.be.equal(1)
            expect(await uToken.balanceOf(addr1.address)).to.be.equal(1000100)
            expect(await eurb.balanceOf(addr1.address)).to.be.equal(999000)
        })

        it("Cannot call borrow the same id with different account", async () => {
            await expect(minter.connect(addr2).borrow(uToken.address, 100, 1000, "0x11")).to.be.reverted
            expect(await minter.borrowBalances("0x11")).to.be.equal(100)
            expect(await minter.collateralBalances("0x11")).to.be.equal(1000)
            expect(await minter.accounts("0x11")).to.be.equal(addr1.address)
        })

        it("Cannot call borrow with existed id", async () => {
            await expect(minter.connect(addr1).borrow(uToken.address, 100, 1000, "0x11")).to.be.reverted
            expect(await minter.borrowBalances("0x11")).to.be.equal(100)
            expect(await minter.collateralBalances("0x11")).to.be.equal(1000)
        })

        it("Cannot call borrow with different type id", async () => {
            var deadline = ((new Date().getTime() )/ 1000).before() + 1000
            await minter.connect(addr2).short(uToken.address, 100, 1000, deadline, 50, "0x9999")
            expect(await minter.borrowBalances("0x9999")).to.be.equal(100)
            expect(await minter.collateralBalances("0x9999")).to.be.equal(1000)
            await minter.connect(addr2).close(uToken.address, "0x9999")
            await expect(minter.connect(addr2).borrow(uToken.address, 100, 1000, "0x9999")).to.be.reverted
            expect(await minter.borrowBalances("0x9999")).to.be.equal(0)
            expect(await minter.collateralBalances("0x9999")).to.be.equal(0)
        })

        it("Target price is not updated", async () => {
            await increaseBlockTime(86400)
            await expect(minter.connect(addr1).borrow(uToken.address, 100, 1000, "0x22")).to.be.reverted 
            expect(await minter.borrowBalances("0x22")).to.be.equal(0)
            expect(await minter.collateralBalances("0x22")).to.be.equal(0)
            expect(await minter.typeBorrow("0x22")).to.be.equal(0)
        })

        it("Less than min collateral ratio", async () => {
            await oracle.connect(owner).update(5)
            await expect(minter.connect(addr1).borrow(uToken.address, 100, 749, "0x22")).to.be.reverted
            expect(await minter.borrowBalances("0x22")).to.be.equal(0)
            expect(await minter.collateralBalances("0x22")).to.be.equal(0)
            expect(await minter.typeBorrow("0x22")).to.be.equal(0)
        })
    })

    describe("editBorrow", async () => {
        it("Edit borrow successfully", async () => {
            expect(await minter.borrowBalances("0x11")).to.be.equal(100)
            expect(await minter.collateralBalances("0x11")).to.be.equal(1000)
            expect(await uToken.balanceOf(addr1.address)).to.be.equal(1000100)
            expect(await eurb.balanceOf(addr1.address)).to.be.equal(999000)
            expect(await minter.connect(addr1).editBorrow(uToken.address, 200, 2000, "0x11")).to.emit(minter, "BorrowAsset").withArgs(addr1.address, "0x11", 200, 2000, ((new Date().getTime() )/ 1000).before())
            expect(await minter.borrowBalances("0x11")).to.be.equal(200)
            expect(await minter.collateralBalances("0x11")).to.be.equal(2000)
            expect(await minter.accounts("0x11")).to.be.equal(addr1.address)
            expect(await minter.typeBorrow("0x11")).to.be.equal(1)
            
            expect(await uToken.balanceOf(addr1.address)).to.be.equal(1000200)
            expect(await eurb.balanceOf(addr1.address)).to.be.equal(998000)
        })

        it("Cannot call edit borrow the same id with different account", async () => {
            await expect(minter.connect(addr2).borrow(uToken.address, 100, 1000, "0x11")).to.be.reverted
            expect(await minter.borrowBalances("0x11")).to.be.equal(200)
            expect(await minter.collateralBalances("0x11")).to.be.equal(2000)
            expect(await minter.accounts("0x11")).to.be.equal(addr1.address)
        })

        it("Cannot call edit borrow with unexisted id", async () => {
            await expect(minter.connect(addr1).editBorrow(uToken.address, 100, 1000, "0x22")).to.be.reverted
            expect(await minter.borrowBalances("0x22")).to.be.equal(0)
            expect(await minter.collateralBalances("0x22")).to.be.equal(0)
        })

        it("Cannot call borrow with different type id", async () => {
            var deadline = ((new Date().getTime() )/ 1000).before() + 1000
            await minter.connect(addr2).short(uToken.address, 100, 1000, deadline, 50, "0x9999")
            expect(await minter.borrowBalances("0x9999")).to.be.equal(100)
            expect(await minter.collateralBalances("0x9999")).to.be.equal(1000)
            await expect(minter.connect(addr2).editBorrow(uToken.address, 100, 1000, "0x9999")).to.be.reverted
        })

        it("Target price is not updated", async () => {
            await increaseBlockTime(86401)
            await expect(minter.connect(addr1).editBorrow(uToken.address, 100, 1000, "0x11")).to.be.reverted 
            expect(await minter.borrowBalances("0x11")).to.be.equal(200)
            expect(await minter.collateralBalances("0x11")).to.be.equal(2000)
            expect(await minter.typeBorrow("0x11")).to.be.equal(1)
        })

        it("Less than min collateral ratio", async () => {
            await oracle.connect(owner).update(5)
            await expect(minter.connect(addr1).borrow(uToken.address, 100, 749, "0x11")).to.be.reverted
            expect(await minter.borrowBalances("0x11")).to.be.equal(200)
            expect(await minter.collateralBalances("0x11")).to.be.equal(2000)
            expect(await minter.typeBorrow("0x11")).to.be.equal(1)
        })
    })

    describe("short", async () => {
        it("Short successfully", async () => {
            var deadline = ((new Date().getTime() )/ 1000).before() + 1000
            expect(await minter.connect(addr1).short(uToken.address, 100, 1000, deadline, 50, "0x33")).to.emit(minter, "Short").withArgs(addr1.address, "0x33", 100, 1000, ((new Date().getTime() )/ 1000).before())
            expect(await minter.borrowBalances("0x33")).to.be.equal(100)
            expect(await minter.collateralBalances("0x33")).to.be.equal(1000)
            expect(await minter.accounts("0x33")).to.be.equal(addr1.address)
            expect(await minter.typeBorrow("0x33")).to.be.equal(2)
            expect(await minter.userBalances("0x33")).to.be.equal(500)
            expect(await uToken.balanceOf(addr1.address)).to.be.equal(1000200)
            expect(await eurb.balanceOf(addr1.address)).to.be.equal(997000)
        })

        it("Cannot call short the same id with different account", async () => {
            var deadline = ((new Date().getTime() )/ 1000).before() + 1000
            await expect(minter.connect(addr2).short(uToken.address, 100, 1000, deadline, 50, "0x33")).to.be.reverted
            expect(await minter.borrowBalances("0x33")).to.be.equal(100)
            expect(await minter.collateralBalances("0x33")).to.be.equal(1000)
            expect(await minter.accounts("0x33")).to.be.equal(addr1.address)
        })

        it("Cannot call short with existed id", async () => {
            var deadline = ((new Date().getTime() )/ 1000).before() + 1000
            await expect(minter.connect(addr1).short(uToken.address, 100, 1000, deadline, 50, "0x33")).to.be.reverted
            expect(await minter.borrowBalances("0x33")).to.be.equal(100)
            expect(await minter.collateralBalances("0x33")).to.be.equal(1000)
        })

        it("Cannot call short with different type id", async () => {
            await minter.connect(addr2).borrow(uToken.address, 100, 1000, "0x999999")
            expect(await minter.borrowBalances("0x999999")).to.be.equal(100)
            expect(await minter.collateralBalances("0x999999")).to.be.equal(1000)
            await minter.connect(addr2).close(uToken.address, "0x999999")
            var deadline = ((new Date().getTime() )/ 1000).before() + 1000
            await expect(minter.connect(addr2).short(uToken.address, 100, 1000, deadline, 50, "0x999999")).to.be.reverted
            expect(await minter.borrowBalances("0x999999")).to.be.equal(0)
            expect(await minter.collateralBalances("0x999999")).to.be.equal(0)
        })

        it("Target price is not updated", async () => {
            await increaseBlockTime(86401)
            var deadline = ((new Date().getTime() )/ 1000).before() + 1000
            await expect(minter.connect(addr1).short(uToken.address, 100, 1000, deadline, 50, "0x44")).to.be.reverted
            expect(await minter.borrowBalances("0x44")).to.be.equal(0)
            expect(await minter.collateralBalances("0x44")).to.be.equal(0)
            expect(await minter.typeBorrow("0x44")).to.be.equal(0)
        })

        it("Less than min collateral ratio", async () => {
            await oracle.connect(owner).update(5)
            var deadline = ((new Date().getTime() )/ 1000).before() + 1000
            await expect(minter.connect(addr1).short(uToken.address, 100, 749, deadline, 50, "0x44")).to.be.reverted
            expect(await minter.borrowBalances("0x44")).to.be.equal(0)
            expect(await minter.collateralBalances("0x44")).to.be.equal(0)
            expect(await minter.typeBorrow("0x44")).to.be.equal(0)
        })

        it("Greater than min collateral ratio", async () => {
            await oracle.connect(owner).update(5)
            var deadline = ((new Date().getTime() )/ 1000).before() + 1000
            await expect(minter.connect(addr1).short(uToken.address, 100, 1501, deadline, 50, "0x44")).to.be.reverted
            expect(await minter.borrowBalances("0x44")).to.be.equal(0)
            expect(await minter.collateralBalances("0x44")).to.be.equal(0)
            expect(await minter.typeBorrow("0x44")).to.be.equal(0)
        })
    })

    describe("editShort", async () => {
        it("Short successfully", async () => {
            expect(await minter.borrowBalances("0x33")).to.be.equal(100)
            expect(await minter.collateralBalances("0x33")).to.be.equal(1000)
            expect(await uToken.balanceOf(addr1.address)).to.be.equal(1000200)
            expect(await eurb.balanceOf(addr1.address)).to.be.equal(997000)
            var lastUpdatedLockTime = await minter.updatedLockTime("0x33")
            var deadline = ((new Date().getTime())/ 1000).before() + 1000
            expect(await minter.connect(addr1).editShort(uToken.address, 200, 2000, deadline, 50, "0x33")).to.emit(minter, "EditShort").withArgs(addr1.address, "0x33",1, 200, 2000, ((new Date().getTime() )/ 1000).before())
            expect(await minter.borrowBalances("0x33")).to.be.equal(200)
            expect(await minter.collateralBalances("0x33")).to.be.equal(2000)
            expect(await minter.accounts("0x33")).to.be.equal(addr1.address)
            expect(await minter.typeBorrow("0x33")).to.be.equal(2)
            expect(await minter.userBalances("0x33")).to.be.equal(1000)
            expect((await minter.updatedLockTime("0x33")).toNumber()).to.be.greaterThan(lastUpdatedLockTime.toNumber())
            expect(await uToken.balanceOf(addr1.address)).to.be.equal(1000200)
            expect(await eurb.balanceOf(addr1.address)).to.be.equal(996000)
        })

        it("Cannot call edit short the same id with different account", async () => {
            var deadline = ((new Date().getTime() )/ 1000).before() + 1000
            await expect(minter.connect(addr2).editShort(uToken.address, 100, 1000, deadline, 50, "0x33")).to.be.reverted
            expect(await minter.borrowBalances("0x33")).to.be.equal(200)
            expect(await minter.collateralBalances("0x33")).to.be.equal(2000)
            expect(await minter.accounts("0x33")).to.be.equal(addr1.address)
        })

        it("Cannot call edit short with unexisted id", async () => {
            var deadline = ((new Date().getTime() )/ 1000).before() + 1000
            await expect(minter.connect(addr1).editShort(uToken.address, 100, 1000, deadline, 50, "0x44")).to.be.reverted
            expect(await minter.borrowBalances("0x44")).to.be.equal(0)
            expect(await minter.collateralBalances("0x44")).to.be.equal(0)
        })

        it("Cannot call edit short with different type id", async () => {
            await minter.connect(addr2).borrow(uToken.address, 100, 1000, "0x999999")
            expect(await minter.borrowBalances("0x999999")).to.be.equal(100)
            expect(await minter.collateralBalances("0x999999")).to.be.equal(1000)
            var deadline = ((new Date().getTime() )/ 1000).before() + 1000
            await expect(minter.connect(addr2).editShort(uToken.address, 100, 1000, deadline, 50, "0x999999")).to.be.reverted
        })

        it("Target price is not updated", async () => {
            await increaseBlockTime(86401)
            var deadline = ((new Date().getTime() )/ 1000).before() + 1000
            await expect(minter.connect(addr1).editShort(uToken.address, 100, 1000, deadline, 50, "0x33")).to.be.reverted
            expect(await minter.borrowBalances("0x33")).to.be.equal(200)
            expect(await minter.collateralBalances("0x33")).to.be.equal(2000)
            expect(await minter.accounts("0x33")).to.be.equal(addr1.address)
            expect(await minter.typeBorrow("0x33")).to.be.equal(2)
        })

        it("Less than min collateral ratio", async () => {
            await oracle.connect(owner).update(5)
            var deadline = ((new Date().getTime() )/ 1000).before() + 1000
            await expect(minter.connect(addr1).editShort(uToken.address, 100, 749, deadline, 50, "0x33")).to.be.reverted
            expect(await minter.borrowBalances("0x33")).to.be.equal(200)
            expect(await minter.collateralBalances("0x33")).to.be.equal(2000)
            expect(await minter.accounts("0x33")).to.be.equal(addr1.address)
            expect(await minter.typeBorrow("0x33")).to.be.equal(2)
        })

        it("Greater than min collateral ratio", async () => {
            await oracle.connect(owner).update(5)
            var deadline = ((new Date().getTime() )/ 1000).before() + 1000
            await expect(minter.connect(addr1).editShort(uToken.address, 100, 1501, deadline, 50, "0x33")).to.be.reverted
            expect(await minter.borrowBalances("0x33")).to.be.equal(200)
            expect(await minter.collateralBalances("0x33")).to.be.equal(2000)
            expect(await minter.accounts("0x33")).to.be.equal(addr1.address)
            expect(await minter.typeBorrow("0x33")).to.be.equal(2)
        })
    })

    describe("close", async () => {
        it("Close successfully", async () => {
            var uTokenBalance = (await uToken.balanceOf(addr1.address)).toNumber() - (await minter.borrowBalances("0x33")).toNumber()
            var collateralBalances = (await eurb.balanceOf(addr1.address)).toNumber() + (await minter.collateralBalances("0x33")).toNumber() - (await oracle.getTargetValue())[0].toNumber() * (await minter.borrowBalances("0x33")).toNumber() * 0.015
            expect(await minter.connect(addr1).close(uToken.address, "0x33")).to.emit(minter, "Close").withArgs(addr1.address, "0x33", 200, 985, ((new Date().getTime() )/ 1000).before())
            expect(await minter.borrowBalances("0x33")).to.be.equal(0)
            expect(await minter.collateralBalances("0x33")).to.be.equal(0)
            expect(await uToken.balanceOf(addr1.address)).to.be.equal(uTokenBalance)
            expect(await eurb.balanceOf(addr1.address)).to.be.equal(collateralBalances)
        })

        it("Cannot call close the same id with different account", async () => {
            await expect(minter.connect(addr2).close(uToken.address, "0x11")).to.be.reverted
            expect(await minter.borrowBalances("0x11")).to.be.equal(200)
            expect(await minter.collateralBalances("0x11")).to.be.equal(2000)
        })

        it("Cannot call close with unexisted id", async () => {
            await expect(minter.connect(addr1).close(uToken.address, "0x33")).to.be.reverted
            await expect(minter.connect(addr1).close(uToken.address, "0x44")).to.be.reverted
        })
    })

    describe("liquidation", async () => {
        it("Liquidation successfully", async () => {
            await oracle.connect(owner).update(7)
            expect(await minter.connect(addr2).liquidation(addr1.address, uToken.address, 100, "0x11")).to.emit(minter, "Liquidation").withArgs(addr2.address, addr1.address, "0x11", 100, 765, ((new Date().getTime() )/ 1000).before())
            expect(await minter.borrowBalances("0x11")).to.be.equal(100)
            expect(await minter.collateralBalances("0x11")).to.be.equal(2000 - 765)
        })

        it("Wrong account to be liquidated", async () => {
            await expect(minter.connect(addr2).liquidation(addr3.address, uToken.address, 100, "0x11")).to.be.reverted
            expect(await minter.borrowBalances("0x11")).to.be.equal(100)
            expect(await minter.collateralBalances("0x11")).to.be.equal(2000 - 765)
        })

        it("Over liquidation", async () => {
            await expect(minter.connect(addr2).liquidation(addr1.address, uToken.address, 201, "0x11")).to.be.reverted
            expect(await minter.borrowBalances("0x11")).to.be.equal(100)
            expect(await minter.collateralBalances("0x11")).to.be.equal(2000 - 765)
        })

        it("Cannot liquidate if more than min collateral ratio", async () => {
            await expect(minter.connect(addr2).liquidation(addr1.address, uToken.address, 1, "0x11")).to.be.revertedWith("More than min")
            expect(await minter.borrowBalances("0x11")).to.be.equal(100)
            expect(await minter.collateralBalances("0x11")).to.be.equal(2000 - 765)
        })

        it("Target price is not updated", async () => {
            await oracle.connect(owner).update(5)
            await minter.connect(addr1).borrow(uToken.address, 100, 1200, "0x55")
            await oracle.connect(owner).update(10)
            await increaseBlockTime(86401)
            await expect(minter.connect(addr2).liquidation(addr1.address, uToken.address, 1, "0x55")).to.be.reverted
            expect(await minter.borrowBalances("0x55")).to.be.equal(100)
            expect(await minter.collateralBalances("0x55")).to.be.equal(1200)
        })
    })

    describe("claimById", async () => {
        it("Claim successfully", async () => {
            await increaseBlockTime(1.21e+6)
            expect(await minter.connect(addr1).claimById("0x33")).to.emit(minter, "ClaimToken").withArgs(addr1.address, "0x33", 1000, ((new Date().getTime() )/ 1000).before())
            expect(await minter.userBalances("0x33")).to.be.equal(0)
            expect(await minter.updatedLockTime("0x33")).to.be.equal(0)
            expect(await minter.totalClaimedById("0x33")).to.be.equal(1000)
        })

        it("Cannot call claim the same id with different account", async () => {
            await expect(minter.connect(addr2).claimById("0x33")).to.be.reverted
            expect(await minter.totalClaimedById("0x33")).to.be.equal(1000)
        })

        it("Still locking", async () => {
            await oracle.connect(owner).update(5)
            var deadline = ((new Date().getTime() )/ 1000).before() + 1000
            await minter.connect(addr1).short(uToken.address, 100, 1000, deadline, 50, "0x66")
            await expect(minter.connect(addr1).claimById("0x66")).to.be.revertedWith("Still locking")
            expect(await minter.userBalances("0x66")).to.be.equal(500)
            expect(await minter.totalClaimedById("0x66")).to.be.equal(0)
        })

        it("Nothing to be claimed", async () => {
            await expect(minter.connect(addr1).claimById("0x33")).to.be.reverted
        })
    })

    describe("claimAll", async () => {
        it("Claim all successfully", async () => {
            var deadline = ((new Date().getTime() )/ 1000).before() + 1000
            var short = await minter.connect(addr1).short(uToken.address, 100, 1000, deadline, 50, "0x77")
            await short.wait()

            await increaseBlockTime(1.21e+6)
            expect(await minter.userBalances("0x66")).to.be.equal(500)
            expect(await minter.userBalances("0x77")).to.be.equal(500)
            expect(await minter.totalClaimedById("0x66")).to.be.equal(0)
            expect(await minter.totalClaimedById("0x77")).to.be.equal(0)
            
            var claim = await minter.connect(addr1).claimAll(["0x66","0x77"])
            await claim.wait()
            expect(await minter.userBalances("0x66")).to.be.equal(0)
            expect(await minter.totalClaimedById("0x66")).to.be.equal(500)
        })
    })

})