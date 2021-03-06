//获取所有准备的数据
let Sleep=require("../../utils/sleep");
let eoshelper=require("../../utils/eoshelper");
let AccountInfo=require("../../utils/accountInfo");
//星球大战
let humanais=require("../../model/humanAI");
//累计下注额
let betRecoders=require("../../model/betRecoders");

let request = require("request");

let CryptoUtil=require('../../encryption/cryptoUtil');
let constants=require("../../utils/constants");
let Eoshelper=require("../../utils/eoshelper");
// let {Buyeos,Rentcpu}=require("../robot/checkCPU");
let dbutils=require("../../utils/dbutils");

let Account=require('../../eostools/accountInfo');

let randomNumber=require('../../utils/randomNumber');
let time=require('../../utils/time');
let TableInfo=require('../../eostools/tableInfo_superagent');
let DbManage=require('../../utils/dbManage');

let fs=require('fs');

//npm install node-schedule
let schedule=require('node-schedule');

let Fileoperation=require('../../utils/fileoperation');

const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;

let gamestatus;
let end_time;
let roundId;
let count=0;
//获取前50个账户
let strarr;
let allAmount=0
let res;
let amount;

//是否已经投注过
let areadyBet=false;
let thisTurn=0;
let newTurn=0;
//开始投注
let  verify=false;

//let
let isRunning=false;

let rule1     = new schedule.RecurrenceRule();
//let times1    = [1,6,11,16,21,26,31,36,41,46,51,56];
let times1    = [1,41];

_bet=async (account,privatekey,quantity,memo,betarea,roundId,endtime,playerInfos,gameTable)=>{
    //let gameTable=await tableInfo.getGameTable();
    let status=await gameTable.rows[0].status;
    let currenttime=await time.networktime();
    console.log("当前网络时间"+currenttime);
    console.log("结束时间类型"+typeof endtime);
    console.log("结束时间"+ endtime);
    console.log("状态"+status);
    var bettime=endtime*1000-currenttime;
    console.log("=================bettime"+bettime);
    if (status===2) {
        if (bettime>=2000&&bettime>0) {
            //判断下注数字 如果随机出一样的 不再下注
            console.log("betting ", account + "==========" + memo);
            let mykey = CryptoUtil.privateDecrypt(privatekey);
            console.log("===================="+new Date());
            try {
                // for (let i = 0; i < playerInfos.rows.length; i++) {
                //     let item=playerInfos.rows[i];
                //     console.log("============="+item.bet_type);
                if (playerInfos.rows.length===0) {
                    let result = eoshelper.api.myFunc(mykey).transact({
                        actions: [{
                            account: "eosio.token",
                            name: 'transfer',
                            authorization: [{
                                actor: account,
                                permission: 'active',
                            }],
                            data: {
                                from: account,
                                to: "warofstar.e",
                                quantity: quantity,
                                memo: memo,
                            },
                        }]
                    }, {
                        blocksBehind: 3,
                        expireSeconds: 30,
                    }, function (error) {
                        console.log(error.name + ': ' + error.message);
                    });
                    // await save(quantity);

                    //保存结果
                    count++;
                    console.log("============="+count+quantity);
                   await Fileoperation.save(count,quantity)
                    let amount=parseInt(quantity);
                    allAmount+=amount;
                    console.log(count+"======================================================下注结果" + JSON.stringify(result)+"总下注"+allAmount);
                }else {
                    playerInfos.forEach(item=>{
                        if (item.player===account&&item.bet_type!==betarea){return}
                        console.log("已经下过注 不允许下注")
                    })
                }
                // }
            }catch (e) {
                console.log("Game is no longer active")
            }finally {
                isRunning=false;
            }
        }
        // }
    }else {
        console.log("警告！！！结算中 不能下注")
    }
};

save=()=>{

};

let buyeos = async (bankaccount,username,memo) => {
    let mykey = await dbutils.companykey("godapp.e")
    // console.log("===================="+mykey);
    console.log(bankaccount + "====" + username + "=======" + memo);
    try {
        let result = await Eoshelper.api.myFunc(mykey).transact({
            actions:
                [
                    {
                        account: 'eosio.token',
                        // 抵押资产的action名，用于租用带宽与cpu,抵押资产,抵押的越多，带宽和cup就越多
                        name: 'transfer',
                        authorization: [{
                            actor: "godapp.e",
                            permission: 'active',
                        }],
                        data: {
                            from: 'godapp.e',
                            to: username,
                            quantity: '2.5000 EOS',
                            memo: memo,
                        }
                    }]

        }, {
            blocksBehind: 3,
            expireSeconds: 30,
        })
        console.log("购买反馈"+result);
    } catch (e) {
        console.log(JSON.stringify("下注失败" + e))
    }
};
let reimbursement = async (gameaccount,bankname,key,amount,memo) => {
    //console.log(gameaccount+"=="+bankname+"=="+key+"==="+amount+"=="+memo);
    try {
        await Eoshelper.api.myFunc(key).transact({
            actions:
                [
                    {
                        account: 'eosio.token',
                        name: 'transfer',
                        authorization: [{
                            actor: gameaccount,
                            permission: 'active',
                        }],
                        data: {
                            from: gameaccount,
                            to: bankname,
                            quantity: amount,
                            memo: memo,
                        }
                    }]

        }, {
            blocksBehind: 3,
            expireSeconds: 30,
        },function err(err) {
            console.log(err);
        })
    }
    catch (e) {
        console.log("err"+e);
    }
};
//租赁cpu scope contract table
checkAccount=async(username,myprivatekey)=>{
    let options = { method: 'POST',
        url: 'https://eos.greymass.com/v1/chain/get_account',
        body: { account_name: username },
        json: true };
    await request(options, async function (error, response, body) {
        if (!error&&response.statusCode===200) {
            let core_liquid_balance=await parseInt(body.core_liquid_balance);
            //获取
            if (core_liquid_balance-50<0){
                await buyeos("godapp.e",username,constants.buyeosmemo);
            }
            if (core_liquid_balance-100>0) {
                amount = String(core_liquid_balance - 100) + ".0000 EOS"
                await reimbursement(username, "godapp.e", myprivatekey, amount, constants.sendbackmemo);
            }
        }

    });
}
checkHouseAccount=async()=>{
    let options = { method: 'POST',
        url: 'https://eos.greymass.com/v1/chain/get_account',
        body: { account_name: "houseaccount" },
        json: true };

    await request(options, async function (error, response, body) {
        if (!error&&response.statusCode===200) {
            let core_liquid_balance=await parseInt(body.core_liquid_balance);
            if (core_liquid_balance-1500>0){
                amount=String(core_liquid_balance-1500)+".0000 EOS";
                let mykey=await dbutils.companykey("houseaccount");
                await reimbursement("houseaccount","godapp.e",mykey,amount,constants.sendbackmemo)
            }
        }
    });
}


start=async ()=> {
    if (isRunning){
        return;
    }
    try {
        isRunning=true;
        console.log("====================================================================================开始")
        //串行 变并行
        let gameTablePromise =  TableInfo.getGameTable();
        let playerInfosPromise =  TableInfo.getPlayerTable();

        let gameTable=await gameTablePromise;
        let playerInfos=await playerInfosPromise;

        let status = gameTable.rows[0].status;
        let largest_winner = gameTable.rows[0].status;
        let roundId = gameTable.rows[0].id;
        let end_time = gameTable.rows[0].end_time;
        let res = await humanais.find({}).limit(11);
        let newarr = [];

        // await checkHouseAccount();
        //robot to godapp.e
        for (let i = 0; i < res.length; i++) {
            let key = await res[i].privatekey;
            let name = await res[i].accountname;
            let myprivatekeyPromise =  await CryptoUtil.privateDecrypt(key);
            //必须串行
            let myprivatekey=await myprivatekeyPromise;
            newarr.push(name);
           // await checkAccount(name, myprivatekey);
        }

        if (playerInfos.rows.length !== 0) {
            for (let j = 0; j < playerInfos.rows.length; j++) {
                let realPlayer = playerInfos.rows[j].player;
                console.log(realPlayer)
                //只包含名字的新数组
                let res = newarr.indexOf(realPlayer);
                if (res !== -1) {
                    console.log("============没有新玩家")
                } else {
                    verify = true
                    console.log("==================================有新玩家" + realPlayer)
                }
            }
        }
       // let resnumber = await randomNumber.norepeatNumber(1);
        let accountname0 = res[4].accountname;
        let privatekey0 = res[4].privatekey;
        // let accountname1 = res[resnumber[1]].accountname;
        // let privatekey1 = res[resnumber[1]].privatekey;

        //await Sleep(2000);
        console.log("必须有值"+new Date()+"verify:"+verify);
        if (status === 2) {
                let area0 = await constants.betarea[Math.floor(Math.random() * constants.betarea.length)]
                let memo0 = roundId + "," + res[0].accountname + "," + area0 + "," + 500000 + ",";
                _bet(accountname0, privatekey0, "50.0000 EOS", memo0, area0, roundId, end_time, playerInfos, gameTable);
                // let area1 = await constants.betarea[Math.floor(Math.random() * constants.betarea.length)]
                // let memo1 = roundId + "," + res[resnumber[1]].accountname + "," + area1 + "," + 100000 + ",";
                //  _bet(accountname1, privatekey1, "10.0000 EOS", memo1, area1, roundId, end_time, playerInfos, gameTable);
            //重置数据
            verify = false;
        }
        console.log("====================================================================================结束");

        process.on('uncaughtException',function (err) {
            console.log(err);
            console.log(err.stack);
        })
    }
    catch (e) {
        console.log(e)
    }finally {
        isRunning=false;
    }
}

//
// if (cluster.isMaster) {
//     console.log(`主进程 ${process.pid} 正在运行`);
//
//     // 衍生工作进程。
//     for (let i = 0; i < numCPUs; i++) {
//         cluster.fork();
//     }
//
//     cluster.on('exit', (worker, code, signal) => {
//         console.log(`工作进程 ${worker.process.pid} 已退出`);
//     });
// } else {
//     // 工作进程可以共享任何 TCP 连接。
//     // 在本例子中，共享的是 HTTP 服务器。
//     rule1.second  = times1;
//     schedule.scheduleJob(rule1, function(){
//         start();
//
//     });
//
//     console.log(`工作进程 ${process.pid} 已启动`);
// }
rule1.second  = times1;
schedule.scheduleJob(rule1, async function(){
    await start();
});