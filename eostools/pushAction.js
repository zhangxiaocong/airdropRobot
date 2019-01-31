let eoshelper = require("../utils/eoshelper");
let CryptoUtil = require('../encryption/cryptoUtil');
let time=require('../utils/time');
let Fileoperation = require('../utils/fileoperation');
let constants=require("../utils/constants");
let count=0;
let Sleep=require("../utils/sleep");
let Dbutils= require('../utils/dbutils');
let gameplayer;
let newplayer=false;
let InternalInfo=require('../db/internal');
let TableInfo = require('../eostools/tableInfo_superagent');
let playerInfos=[];
let Internal = require('../db/internal');
let logger=require('../exception/exception');

// _bet = async (account, privatekey, quantity, memo, betarea, roundId, endtime, playerInfos, gameTable) => {
//     console.log("======================当前下注"+account+"+"+quantity+"+"+memo);
//     console.log("memo======================"+memo);
//     let promise;
//     let status = await gameTable.rows[0].status;
//     let currenttime = await time.networktime();
//     // console.log("当前网络时间" + currenttime);
//     console.log(endtime);
//     let bettime = Number(endtime * 1000 - currenttime);
//     console.log("=================bettime" + bettime);
//     let newtime=Math.abs(bettime);
//     console.log("=================newtime" + newtime);
//     let mytime=Math.abs(bettime)+20;
//     await Sleep.sleep(500);
//     if (status===2&&bettime>=2000) {
//         //判断下注数字 如果随机出一样的 不再下注
//         let mykey = CryptoUtil.privateDecrypt(privatekey);
//         try {
//             if (playerInfos.rows.length === 0) {
//                 promise=new Promise(async (resolve,reject)=>{
//                     if (reject)
//                         eoshelper.api.myFunc(mykey).transact({
//                             actions: [{
//                                 account: "eosio.token",
//                                 name: 'transfer',
//                                 authorization: [{
//                                     actor: account,
//                                     permission: 'active',
//                                 }],
//                                 data: {
//                                     from: account,
//                                     to: "warofstar.e",
//                                     quantity: quantity,
//                                     memo: memo,
//                                 },
//                             }]
//                         }, {
//                             blocksBehind: 3,
//                             expireSeconds: 30,
//                         }, function (error) {
//                             if (error) return reject(error);
//                         }).then(async result=>{
//                             // await save(quantity);
//                             let bet_result=await JSON.stringify(result);
//                             console.log("======================================================结束" + bet_result);
//                             //保存结果
//                             count++;
//                             console.log("=============" + count + quantity);
//                             await Fileoperation.save(count, parseInt(quantity));
//                             await Fileoperation.saveBetData(count, parseInt(quantity));
//                             resolve(bet_result);
//                         });
//
//                 });
//
//             } else {
//                 for (let i = 0; i < playerInfos.rows.length; i++) {
//                     let item=playerInfos.rows[i];
//                     if (item.player === account && item.bet_type !== betarea) {
//                         return
//                     }
//                 }
//             }
//
//         } catch (e) {
//             console.log("Game is no longer active")
//         } finally {
//             isRunning = false;
//         }
//     } else {
//         logger.debug("警告！！！结算中 不能下注");
//     }
//     return promise;
// };
betBaccarat = async (account, privatekey, quantity, memo, betarea, roundId, endtime, playerInfos, gameTable) => {
    console.log("======================当前下注"+account+"+"+quantity+"+"+memo);
    for (let i = 0; i <playerInfos.rows.length ; i++) {
        gameplayer=await playerInfos.rows[i].player;
        logger.debug("======================gameplayer"+gameplayer);
        if (account===gameplayer){
            newplayer=true;
        }
    }
    if (newplayer===true){
        return
    }
    let promise;
    let status = await gameTable.rows[0].status;
    // let currenttime = parseInt()await Internal.get_Iime();
    // console.log("当前网络时间" + currenttime);
    // let bettime = Number(endtime * 1000 - currenttime);
    // let newtime=Math.abs(bettime);
    Sleep.sleep(500);
    logger.debug("privatekey:======================当前私钥"+privatekey);
    let mykey = await Dbutils.myaikey(privatekey);
    // console.log("=========="+mykey);
    try {
        if (playerInfos.rows.length === 0) {
            promise=new Promise(async (resolve,reject)=>{
                if (reject)
                    eoshelper.api.myFunc(mykey).transact({
                        actions: [{
                            account: "eosio.token",
                            name: 'transfer',
                            authorization: [{
                                actor: account,
                                permission: 'active',
                            }],
                            data: {
                                from: account,
                                to: "baccarat.e",
                                quantity: quantity,
                                memo: memo,
                            },
                        }]
                    }, {
                        blocksBehind: 3,
                        expireSeconds: 30,
                    }, function (error) {
                        if (error) return reject(error);
                    }).then(async result=>{
                        // await save(quantity);
                        let bet_result=await JSON.stringify(result);
                        console.log("bet_result:"+bet_result);
                        console.log("result:"+bet_result);
                        //保存结果
                        count++;
                        console.log("=============" + count + quantity);
                        // await Fileoperation.save(count, parseInt(quantity));
                        // await Fileoperation.saveBetData(count, parseInt(quantity));
                        resolve(bet_result);
                    });

            });

        } else {
            for (let i = 0; i < playerInfos.rows.length; i++) {
                let item=playerInfos.rows[i];
                if (item.player === account && item.bet_type !== betarea) {
                    return
                }
            }
        }
    } catch (e) {
        logger.debug("Game is no longer active"+e)
    }
    newplayer=false;
    return promise;
};


async function getPlayerInfo() {
    let playerInfosPromise =  TableInfo.baccarat_getPlayerTable();
let playerInfos = await playerInfosPromise;
console.log("playerInfos" + JSON.stringify(playerInfos.rows));
//获取玩家信息并保存到redis
if (playerInfos != null) {
    // await InternalInfo.set_playerInfo(JSON.stringify(playerInfos.rows));
    for (let i = 0; i < playerInfos.rows.length; i++) {
        let players = await playerInfos.rows[i].player;
        console.log("players:====================" + players);
    }
}
return playerInfos;
}
Baccarat = async (account, privatekey, quantity, memo, betarea, roundId, endtime, playerInfos, gameTable) => {
    let mykey = await CryptoUtil.privateDecrypt(privatekey);
    logger.debug("======================当前下注"+account+"+"+quantity+"+"+memo+"mykey:"+mykey);
    if (mykey===null)return;
    try {
        const result=eoshelper.api.myFunc(mykey).transact({
            actions: [{
                account: "eosio.token",
                name: 'transfer',
                authorization: [{
                    actor: account,
                    permission: 'active',
                }],
                data: {
                    from: account,
                    to: "baccarat.e",
                    quantity: quantity,
                    memo: memo,
                },
            }]
        }, {
            blocksBehind: 3,
            expireSeconds: 30,
        });
        logger.debug(result);
    }catch (e) {
       let object = JSON.parse(e);
       let result;
       let code=object.error.code;
        switch (code) {
            case 3010001:
                result = "Invalid name";
                break;
            case 3010004:
                result = "Invalid authority";
                break;
            case 3010011:
                result = "Invalid asset";
                break;
            case 3040000:
                result = "Transaction exception";
                break;
            case 3040005:
                result = "Expired Transaction";
                break;
            case 3040008:
                result =  "Duplicate transaction";
                break;
            case 3040009:
                result = "Duplicate deferred transaction";
                break;
            case 3050001:
                result = "Account name already exists";
                break;
            case 3050003:
                result = "eosio_assert_message assertion failure";
                break;
            case 3050004:
                result = "eosio_assert_code assertion failure";
                break;
            case 3080001:
                result =  "Account using more than allotted RAM usage";
                break;
            case 3080002:
                result =  "Transaction exceeded the current network usage limit imposed on the transaction";
                break;
            case 3080003:
                result = "Transaction network usage is too much for the remaining allowable usage of the current block";
                break;
            case 3080004:
                result = "Transaction exceeded the current CPU usage limit imposed on the transaction";
                break;
            case 3080005:
                result =  "Transaction CPU usage is too much for the remaining allowable usage of the current block";
                break;
            case 3080007:
                result ="Transaction exceeded the current greylisted account network usage limit";
                break;
            case 3081001:
                result ="Transaction reached the deadline set due to leeway on account CPU limits";
                break;
            case 3090000:
                result = "Authorization exception";
                break;
            case 3090003:
                result =  "Provided keys, permissions, and delays do not satisfy declared authorizations";
                break;
            case 3230002:
                result = "Database API Exception";
                break;

            default:
                result = code + " " + message;
                break;
        }
        Logger.debug(result)
    }
};
////497,undefined,24,1000,
Roulette = async (account, privatekey, quantity, memo, betarea, roundId, endtime, playerInfos, gameTable) => {
    logger.debug("======================当前下注"+account+"+"+quantity+"+"+memo);
    let mykey = await CryptoUtil.privateDecrypt(privatekey);
    console.log(mykey);
    //需处理异常
    // process.on('unhandledRejection', async (reason, promise) => {
    //     console.log('Unhandled Rejection at:', reason.stack || reason)
    // Recommended: send the information to sentry.io
    // or whatever crash reporting service you use
    const result=eoshelper.api.myFunc(mykey).transact({
        actions: [{
            account: "eosio.token",
            name: 'transfer',
            authorization: [{
                actor: account,
                permission: 'active',
            }],
            data: {
                from: account,
                to: "roulette.e",
                quantity: quantity,
                memo: memo,
            },
        }]
    }, {
        blocksBehind: 3,
        expireSeconds: 30,
    });
    logger.debug(result);
};


module.exports={betBaccarat,Baccarat,Roulette};
//
// let aa=async ()=>{
//     let test=await checkPlayerInfo("childrengirl");
//     console.log("test:"+test);
//     return test
// }
//
// aa();