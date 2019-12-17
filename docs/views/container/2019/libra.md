# facebook libra尝鲜，没赶上比特币能不能上这趟车

# 白皮书重点
在开始玩libra测试网络之前先来画画libra白皮书中的重点，比如币怎么产生，怎么交易等。

> 建立一套简单的、无国界的货币和为数十亿人服务的金融基础设施

效果是比如你要到美国去，需要点美元，那么可以通过机构把人民币换成libra币，再兑换成美元，或者直接用libra币进行交易。就像移动支付一样简单。

> 我们凭什么相信libra币

将全部使用真实资产储备（称为“Libra 储备”）作为担保，并由买卖 Libra 并存在竞争关系的交易平台网络提供支持

需要有大量资产做信用背书。Libra 协会是一个独立的非营利性成员制组织，总部设在瑞士日内瓦。协会旨在协调和提供网络与资产储备的管理框架，并牵头进行能够产生社会影响力的资助，为普惠金融提供支持。

所以这个协会权利巨大，前提你得信任这个协会. Libra 协会的成员将包括分布在不同地理区域的各种企业、非营利组织、多边组织和学术机构

任何持有 Libra 的人都可以获得高度保证， 他们能够根据汇率将自己持有的这种数字货币兑换为当地货币，就像在旅行时将一种货币换成另一种货币一样。这种方法类似于过去引入其他货币的方式：确保这种货币可以用于换取真实资产，比如黄金。目的是为了帮助培养人们对新货币的信任，并在货币诞生初期实现广泛使用。尽管Libra 不会使用黄金作为支持，但它将采用一系列低波动性资产（比如，由稳定且信誉良好的中央银行提供的现金和政府证券）进行抵押。

Libra 储备中的资产将由分布在全球各地且具有投资级信用评价的托管机构持有，以确保资产的安全性和分散性

> 只有 Libra 协会能够制造 (mint) 和销毁 (burn) Libra

只有当授权经销商投入法定资产从协会买入 Libra 币以完全支持新币时，Libra 币才会被制造。只有当授权经销商向协会卖出 Libra 币以换取抵押资产时，Libra 币才会被销毁。

> Libra 协会的一个重要目标就是逐步提高去中心化的程度

协会将逐步实现 Libra 网络的非许可型管理和共识。协会将力求在五年内启动这一过渡，并以此逐渐减少对创始成员的依赖。同样地，作为 Libra 储备的管理者，Libra 协会也会力争最大程度降低对自身的依赖。

# 编译
## 环境准备
Libra测试版对cmake 与proto版本要求比较高，建议从源码先安装这俩，要不然后面可能会报这个错：

```
 Compiling grpcio-sys v0.4.4
error: failed to run custom build command for `grpcio-sys v0.4.4`

Caused by:
  process didn't exit successfully: `/root/libra/libra/target/debug/build/grpcio-sys-18712f499919ddc1/build-script-build` (exit code: 101)
--- stdout
cargo:rerun-if-changed=grpc_wrap.cc
cargo:rerun-if-changed=grpc
cargo:rerun-if-env-changed=GRPCIO_SYS_USE_PKG_CONFIG
cargo:rerun-if-env-changed=CARGO_CFG_TARGET_OS
```

> 安装cmake

```
wget https://github.com/Kitware/CMake/releases/download/v3.16.0-rc3/cmake-3.16.0-rc3.tar.gz
tar zxvf cmake-3.16.0-rc3.tar.gz 
cd cmake-3.16.0-rc3
yum install -y openssl-devel
./configure && make && make install
```

> 安装protobuf

```
yum install -y autoconf
wget https://github.com/google/protobuf/releases/download/v3.6.1/protobuf-all-3.6.1.tar.gz
tar zxvf protobuf-all-3.6.1.tar.gz
./autogen.sh
./configure
make
make install
```

## 编译libra

```
git clone https://github.com/libra/libra.git
cd libra
git checkout testnet
./scripts/dev_setup.sh
```
这里会帮助你安装go rust啥的，脚本里安装的protoc cmake可能不能用，所以上面先装了

# 启动测试网络

```
./scripts/cli/start_cli_testnet.sh
```
然后就会进入到这个交互式命令行中

```
usage: <command> <args>

Use the following commands:

account | a
  Account operations
query | q
  Query operations
transfer | transferb | t | tb
  <sender_account_address>|<sender_account_ref_id> <receiver_account_address>|<receiver_account_ref_id> <number_of_coins> [gas_unit_price (default=0)] [max_gas_amount (default 10000)] Suffix 'b' is for blocking.
  Transfer coins from account to another.
help | h
  Prints this help
quit | q!
  Exit this client


Please, input commands:

libra%
```

> 创建账户

0是Alice 1是Bob

```
libra% account create
>> Creating/retrieving next account from wallet
Created/retrieved account #0 address 3ed8e5fafae4147b2a105a0be2f81972883441cfaaadf93fc0868e7a0253c4a8
```
这里返回索引0 和一个hex账户地址，0只是本地方便你操作的.

再创建一个
```
libra% account create
>> Creating/retrieving next account from wallet
Created/retrieved account #1 address 8337aac709a41fe6be03cad8878a0d4209740b1608f8a81566c9a7d4b95a2ec7
```

此时就可以看到两个账户了

```
libra% account list
User account index: 0, address: 3ed8e5fafae4147b2a105a0be2f81972883441cfaaadf93fc0868e7a0253c4a8, sequence number: 0
User account index: 1, address: 8337aac709a41fe6be03cad8878a0d4209740b1608f8a81566c9a7d4b95a2ec7, sequence number: 0
```

> 发行货币

使用mint命令“铸币”，就和发型货币一样一样，这里与比特币的区别就是比特币是算力“挖”出来的，而libra只用权威机构敲个命令。。。

```
libra% account mint 0 110
>> Minting coins
Mint request submitted
```
0 是你账户索引，110就是“银子”

再给52大洋给Bob

```
libra% account mint 1 52
>> Minting coins
Mint request submitted
```

> 查询账户

```
libra% query balance 0
Balance is: 110
libra% query balance 1
Balance is: 52
```

> 转账

先看交易sequence,每转出一次加1
```
libra% query sequence 0
>> Getting current sequence number
Sequence number is: 0
libra% query sequence 1
>> Getting current sequence number
Sequence number is: 0
```

Alice（0）转 10大洋给Bob(1)

```
libra% transfer 0 1 10
>> Transferring
Transaction submitted to validator
To query for transaction status, run: query txn_acc_seq 0 0 <fetch_events=true|false>
```

然后再看下交易sequence
```
libra% query sequence 0
>> Getting current sequence number
Sequence number is: 1
libra% query sequence 1
>> Getting current sequence number
Sequence number is: 0
```

双方账户：
```
libra% query balance 0
Balance is: 100
libra% query balance 1
Balance is: 62
```
Alice少了10元，Bob多了10元.


# 结束语
全球化的货币必将到来，只是不是libra不知道，但是libra的全球推广必然会遭受很多国家的巨大阻力，这可能是历史上一次巨大的货币战争。

> 最后祝愿大家将来能够一行命令修改自己账户里的数字~

探讨可加QQ群：98488045

