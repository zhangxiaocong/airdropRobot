// // //获取eos实例
// //
let request = require("request");
//获取eos
Eos=require("eosjs");
//连接数据库
require("../db/db")
//获取
let Eoshelper=require("../utils/eoshelper");

//获取对应的表
let AirUser=require("../model/humanAI");

let count=0;
let username;
let url='https://proxy.eosnode.tools/v1/chain/get_account'

let dbutils =require("../utils/dbutils");

queryaccount=async ()=>{
    let results= await AirUser.find({}).limit(20);
    for (let i = 0; i <results.length; i++) {
        setTimeout( async ()=> {
         username=results[i].accountname;
         count++
         await checkAccount(username);
        }, i * 10000);
   }
    await setTimeout(queryaccount,200000);

};


let buyeos = async (bankaccount,username,memo) => {
    let mykey = await dbutils.mykey("godapp.e")
    await Eoshelper.api.myFunc(mykey).transact({
        actions:
            [
                {
                    account: 'eosio.token',
                    // 抵押资产的action名，用于租用带宽与cpu,抵押资产,抵押的越多，带宽和cup就越多
                    name: 'transfer',
                    authorization: [{
                        actor: bankaccount,
                        permission: 'active',
                    }],
                    data: {
                        from: 'godapp.e',
                        to: username,
                        quantity: '1.0000 EOS',
                        memo: memo,
                    }
                }]

    }, {
        blocksBehind: 3,
        expireSeconds: 30,
    }).catch(
        result => {
            console.log("购买失败" + result);
        }
    )
    count++;
    console.log("====" + username + "购买eos结束")
}

//租赁cpu scope contract table
let rentcpu=(username)=>{
    let request = require("request");
    let options = { method: 'POST',
        url: 'https://proxy.eosnode.tools/v1/chain/get_table_rows',
        body: { scope: "bankofstaked",code:"bankofstaked",table:"plan",json:true },
        json: true };

    request(options, async function (error, response, body) {
        if (error) {
            return
        }
        //0.2 eos 租赁7天 每一个
        console.log("price=========================================="+body.rows[5].price);
        _rentcpu(body.rows[5].price,username,"from eos laomao， rent cpu ");
    });

}

checkAccount=(username)=>{
    let request = require("request");
    let options = { method: 'POST',
    url: 'https://proxy.eosnode.tools/v1/chain/get_account',
    body: { account_name: username },
    json: true };

request(options, async function (error, response, body) {
                if (error) {
                    return
                }
                let assets=await parseInt(body.core_liquid_balance,0);
                console.log(username+"========================================"+body.core_liquid_balance);
                if (assets<=20){
                   await buyeos("godapp.e",username,"buy eos")
                }
                let used=body.cpu_limit.used
                let max=body.cpu_limit.max
                let cpupecentage=used/max;
                console.log(username+"=============================================cpu="+cpupecentage);
                if ( cpupecentage>= 0.8) {
                    //console.log(cpupecentage);
                   await rentcpu(username)
                }

            //保存数据到数据库
               await changedb(username,body);

});
}
           async function changedb(username,body) {
                let query = {accountname: username};
               await AirUser.findOneAndUpdate(query,
                    {
                        net_limit: {
                            used: body.net_limit.used,
                            available: body.net_limit.available,
                            max: body.net_limit.max
                        },
                        cpu_limit: {
                            used: body.cpu_limit.used,
                            available: body.cpu_limit.available,
                            max: body.cpu_limit.max
                        },
                        ram_usage: body.ram_usage,
                        assets: body.core_liquid_balance
                    },
                    {multi: true}).catch(error => {
                    console.log(error);
                });
               console.log(username+"=====================================dbfinished");
            }


_rentcpu=async (price,account,memo)=>{
    if(!account){
        return false
    }
    console.log("rent cpu for",account);
    let mykey = await dbutils.mykey("godapp.e")
    try {
        await Eoshelper.api.myFunc(mykey).transact({
            actions: [{
                account: 'eosio.token',
                name: 'transfer',
                authorization: [{
                    actor: 'godapp.e',
                    permission: 'active',
                }],
                data: {
                    from: 'godapp.e',
                    to: account,
                    quantity: price,
                    memo: memo,
                },
            }]
        }, {
            blocksBehind: 3,
            expireSeconds: 30,
        });
        console.log("finished=========="+account);
        return false;
    }catch (e) {
        console.log(e);
        return false;
    }
    return true;

}


queryaccount();

module.exports={queryaccount,checkAccount}