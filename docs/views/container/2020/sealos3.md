# kuberentes 离线丝滑安装

为了让kubernetes安装与集群节点管理更丝滑，这次我们是花了大功夫。这次做了很多非常大的更新，并经过充分测试与bug修复让其稳定。

力争把这个简单的事做到极致。

> 剥离定制kubeam功能到sealos中
 
之前定制kubeadm代码实现的100年证书功能和localLB,已经全部剥离到sealos中，现在已经是完完全全原生的kubernetes了。

为了减少对第三方命令行工具的依赖，sealos证书完全是通过调用golang的库生成，生成逻辑与kubeadm保持一致，不过把client-go中写死一年的证书时间变成了一个参数。

ipvs的localLB断然也不屑于去调用类似ipvsadm的工具，也是走系统调用完成，还顺便修复了netlink和内核版本不兼容的问题，这个问题1.18版本的kube-proxy目前一直存在需要升级内核解决。

> 自由的增加删除master或node节点

统统一条命令的事，难道找到其它的如此丝滑简单的方式增删你集群中的节点了

> 超全的kubernetes版本支持

基本官方release的正式版我们都会在1个工作日内发布离线包。 所以基本是全网最快最全，而且为了用户有更好的下载体验，放到阿里云oss上了,下载丝滑。

之所以我们这么快得益于我们的打包和自动化测试机器人。

> 体验优化再优化

* 精简日志输出
* 实时流日志，大部分远程执行命令的工具日志都是同步输出，就是等到日志执行完再返回给标准输出，而sealos执行远程命令时异步输出，这就丝滑太多了。
* lvscare开机ipvs内核模块加载

## 🚀 快速开始

> 环境信息

主机名|IP地址
---|---
master0|192.168.0.2 
master1|192.168.0.3 
master2|192.168.0.4 
node0|192.168.0.5 

服务器密码：123456

> 只需要准备好服务器，在任意一台服务器上执行下面命令即可

```sh
# 下载并安装sealos, sealos是个golang的二进制工具，直接下载拷贝到bin目录即可, release页面也可下载
$ wget -c https://sealyun.oss-cn-beijing.aliyuncs.com/latest/sealos && \
    chmod +x sealos && mv sealos /usr/bin 

# 下载离线资源包
$ wget -c https://sealyun.oss-cn-beijing.aliyuncs.com/d551b0b9e67e0416d0f9dce870a16665-1.18.0/kube1.18.0.tar.gz 

# 安装一个三master的kubernetes集群
$ sealos init --passwd 123456 \
	--master 192.168.0.2  --master 192.168.0.3  --master 192.168.0.4  \
	--node 192.168.0.5 \
	--pkg-url /root/kube1.18.0.tar.gz \
	--version v1.18.0
```

> 参数含义

参数名|含义|示例
---|---|---
passwd|服务器密码|123456
master|k8s master节点IP地址| 192.168.0.2
node|k8s node节点IP地址|192.168.0.3
pkg-url|离线资源包地址，支持下载到本地，或者一个远程地址|/root/kube1.16.0.tar.gz
version|[资源包](http://store.lameleg.com)对应的版本|v1.16.0

> 增加master

```shell script
🐳 → sealos join --master 192.168.0.6 --master 192.168.0.7
🐳 → sealos join --master 192.168.0.6-192.168.0.9  # 或者多个连续IP
```

> 增加node

```shell script
🐳 → sealos join --node 192.168.0.6 --node 192.168.0.7
🐳 → sealos join --node 192.168.0.6-192.168.0.9  # 或者多个连续IP
```
> 删除指定master节点

```shell script
🐳 → sealos clean --master 192.168.0.6 --master 192.168.0.7
🐳 → sealos clean --master 192.168.0.6-192.168.0.9  # 或者多个连续IP
```

> 删除指定node节点

```shell script
🐳 → sealos clean --node 192.168.0.6 --node 192.168.0.7
🐳 → sealos clean --node 192.168.0.6-192.168.0.9  # 或者多个连续IP
```

> 清理集群

```shell script
🐳 → sealos clean
```