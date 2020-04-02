---
title: 傻傻分不清楚的kubernetes证书
date: 2020-04-01
tags:
 - kubeadm
categories:
 - develop
---

# 傻傻分不清楚的kubernetes证书 

kubeadm 生成的一坨证书是不是让人很蒙逼，这些东西没那么神奇，来深入扒扒其内裤。
```shell script
root@k8s-master:/etc/kubernetes/pki# tree
.
|-- apiserver.crt
|-- apiserver-etcd-client.crt
|-- apiserver-etcd-client.key
|-- apiserver.key
|-- apiserver-kubelet-client.crt
|-- apiserver-kubelet-client.key
|-- ca.crt
|-- ca.key
|-- etcd
|   |-- ca.crt
|   |-- ca.key
|   |-- healthcheck-client.crt
|   |-- healthcheck-client.key
|   |-- peer.crt
|   |-- peer.key
|   |-- server.crt
|   `-- server.key
|-- front-proxy-ca.crt
|-- front-proxy-ca.key
|-- front-proxy-client.crt
|-- front-proxy-client.key
|-- sa.key
`-- sa.pub

1 directory, 22 files
```

## 从RSA说起

要深入了解证书的作用，首先需要了解一些原理和具备一些基本知识，比如什么是非对称加密，什么是公钥，私钥，数字签名是啥等。先从RSA算法说起。

非对称加密会生成一个密钥对，如上面的sa.key sa.pub就是密钥对，一个用于加密一个用于解密。

明文 + 公钥 => 密文

密文 + 私钥 => 明文

那么此时没有私钥，就很难把密文解密。

进一步再详细看看其原理, 不想关注的可以跳过下面原理部分：

假设我们想加密一个单词Caesar, 先把它变成一串数字，比如Ascii码 X = 067097101115097114 这也就是我们需要加密的 明码。 现在来对X进行加密。

1. 找两个很大的质数 P 和 Q 计算他们的乘积 N = P * Q  再令M = (P - 1)(Q - 1)
2. 找到一个数E满足E和M除了1以外没有公约数
3. 找到一个数D满足E乘以D除以M余1, E * D mod M = 1

现在 E就是公钥，可以公开给任何人进行加密

D就是私钥，用于解密，一定要自己保存好
    
联系公钥和私钥的N是公开的, 为什么这个可以公开，就是因为根据P Q算出N很简单，但是把N分解成P Q两个大质数非常的难，所以公开了现有的计算机算力也很难破解

现在来加密：

pow(X,E) mod N = Y  Y就是密文，现在没有D(私钥) 神仙也没法算出X(明文)

解密：

pow(Y,D) mod N = X X是明文，明文就出来了。

数学是不是很神奇，现在可认为 sa.key = D  sa.pub = E

## 数字签名

假设你写一封信给老板，内容是"老板我崇拜你"，然后让同事把信送给老板，怎么确定这信就是你写的，而且怎么防止同事送信过程中把信改成 "老板你是个SB"?

可以这样做，首先你生成一个密钥对，把公钥给老板，然后对信的内容做一个hash摘要，再用私钥对摘要进行加密，结果就是签名

这样老板拿到信之后用公钥进行解密，发现得到的hash值与信的hash值是一致的，这样确定了信就是你写的

所以数字签名是加密技术的一种运用，与完全加密信息的区别是这里信息是公开的，你的同事可以看到你吹捧老板。

## 数字证书

### 根证书与证书

通常我们配置https服务时需要到"权威机构"申请证书。

过程是这样的：

1. 网站创建一个密钥对，提供公钥和组织以及个人信息给权威机构
2. 权威机构颁发证书
3. 浏览网页的朋友利用权威机构的根证书公钥解密签名，对比摘要，确定合法性
4. 客户端验证域名信息有效时间等（浏览器基本都内置各大权威机构的CA公钥）

这个证书包含如下内容：

1. 申请者公钥
2. 申请者组织和个人信息
3. 签发机构CA信息，有效时间，序列号等
4. 以上信息的签名

根证书又名自签名证书，也就是自己给自己颁发的证书。CA(Certificate Authority)被称为证书授权中心，k8s中的ca证书就是根证书。

## kubernetes证书

有了以上基础，下面咱们正式开始。。。

先分类：

密钥对：sa.key sa.pub
根证书：ca.crt etcd/ca
私钥 ： ca.key 等
其它证书

首先其它证书都是由CA根证书颁发的，kubernetes与etcd使用了不同的CA, 很重要的一点是证书是用于客户端校验还是服务端校验。 下面一个一个来看：

## service Account密钥对 sa.key sa.pub

提供给 kube-controller-manager 使用. kube-controller-manager 通过 sa.key 对 token 进行签名, master 节点通过公钥 sa.pub 进行签名的验证
如 kube-proxy 是以 pod 形式运行的, 在 pod 中, 直接使用 service account 与 kube-apiserver 进行认证, 此时就不需要再单独为 kube-proxy 创建证书了, 会直接使用token校验

> 根证书

```shell script
pki/ca.crt
pki/ca.key
```
为k8s集群证书签发机构

> apiserver 证书

```shell script
pki/apiserver.crt
pki/apiserver.key
```

> kubelet证书

```shell script
pki/apiserver-kubelet-client.crt
pki/apiserver-kubelet-client.key
```

kubelet要主动访问kube-apiserver, kube-apiserver也需要主动向kubelet发起请求, 
所以双方都需要有自己的根证书以及使用该根证书签发的服务端证书和客户端证书. 在kube-apiserver中, 一般明确指定用于https访问的服务端证书和带有CN用户名信息的客户端证书.
而在kubelet的启动配置中, 一般只指定了ca根证书, 而没有明确指定用于https访问的服务端证书,在生成服务端证书时, 一般会指定服务端地址或主机名, 
kube-apiserver相对变化不是很频繁, 所以在创建集群之初就可以预先分配好用作 kube-apiserver的IP 或主机名/域名, 
但是由于部署在node节点上的kubelet会因为集群规模的变化而频繁变化, 而无法预知node的所有IP信息, 所以kubelet上一般不会明确指定服务端证书, 
而是只指定ca根证书, 让kubelet根据本地主机信息自动生成服务端证书并保存到配置的cert-dir文件夹中

> Aggregation 证书

代理根证书：
 ```shell script
pki/front-proxy-ca.crt
pki/front-proxy-ca.key
```
由代理根证书签发的客户端证书：
```shell script
pki/front-proxy-client.crt
pki/front-proxy-client.key
```

比如使用kubectl proxy代理访问时，kube-apiserver使用这个证书来验证客户端证书是否是自己签发的证书。

> etcd 根证书

```shell script
pki/etcd/ca.crt
pki/etcd/ca.key
```

> etcd节点间相互通信 peer证书

由根证书签发
```shell script
pki/etcd/peer.crt
pki/etcd/peer.key
```

> pod中Liveness探针客户端证书

```shell script
pki/etcd/healthcheck-client.crt
pki/etcd/healthcheck-client.key
```
可查看yaml探活配置：
```shell script
Liveness:       exec [/bin/sh -ec ETCDCTL_API=3 etcdctl \
  --endpoints=https://[127.0.0.1]:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/healthcheck-client.crt \
  --key=/etc/kubernetes/pki/etcd/healthcheck-client.key get foo] \
  delay=15s timeout=15s period=10s #success=1 #failure=8
```

> apiserver访问etcd的证书

```shell script
pki/apiserver-etcd-client.crt
pki/apiserver-etcd-client.key
```

这里注意一下客户端证书与服务端证书区别，服务端证书通常会校验地址域名等。

## 代码实现

kubeadm把证书时间写死成了1年（client-go就写死了），这是个悲伤的故事，导致sealos不得不把证书生成的逻辑剥离出来以让安装支持任意过期时间。

下面根据源码来深入体验下kubeadm的证书生成，直接看kubeadm代码可能有点累，sealos/cert目录剥离出核心的代码更容易读懂一些。

以下为了突出核心逻辑，代码中删除一些错误处理细节，有兴趣可阅读github.com/fanux/sealos/cert源码

### 密钥对生成
```go
// create sa.key sa.pub for service Account
func GenerateServiceAccountKeyPaire(dir string) error {
	key, err := NewPrivateKey(x509.RSA)
	pub := key.Public()
	err = WriteKey(dir, "sa", key)
	return WritePublicKey(dir, "sa", pub)
}
```
生成私钥, 这里的keyType是x509.RSA
```go
func NewPrivateKey(keyType x509.PublicKeyAlgorithm) (crypto.Signer, error) {
	if keyType == x509.ECDSA {
		return ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	}
	return rsa.GenerateKey(rand.Reader, rsaKeySize)
}
```

### 生成CA证书

会返回ca.crt（自签名证书） ca.key(私钥)
```go
func NewCaCertAndKey(cfg Config) (*x509.Certificate, crypto.Signer, error) {
	key, err := NewPrivateKey(x509.UnknownPublicKeyAlgorithm)
	cert, err := NewSelfSignedCACert(key, cfg.CommonName, cfg.Organization, cfg.Year)
	return cert, key, nil
}
```

根据私钥生成自签名证书, NotAfter就是证书过期时间，我们很友好的加了个变量而不是写死：
```go
// NewSelfSignedCACert creates a CA certificate
func NewSelfSignedCACert(key crypto.Signer, commonName string, organization []string, year time.Duration) (*x509.Certificate, error) {
	now := time.Now()
	tmpl := x509.Certificate{
		SerialNumber: new(big.Int).SetInt64(0),
		Subject: pkix.Name{
			CommonName:   commonName,
			Organization: organization,
		},
		NotBefore:             now.UTC(),
		NotAfter:              now.Add(duration365d * year).UTC(),
		KeyUsage:              x509.KeyUsageKeyEncipherment | x509.KeyUsageDigitalSignature | x509.KeyUsageCertSign,
		BasicConstraintsValid: true,
		IsCA:                  true,
	}

	certDERBytes, err := x509.CreateCertificate(rand.Reader, &tmpl, &tmpl, key.Public(), key)
	return x509.ParseCertificate(certDERBytes)
}
```
非常要注意里面的CommonName和Organization字段，非常有用，比如我们创建一个k8s用户指定该用户属于哪个用户组，对应上面这两个字段。

比如证书中 fanux 属于 sealyun这个组织，那么生成一个kubeconfig, 就相当于有了fanux这个用户，这样k8s在做认证时只需要校验签名就行，而不需要去访问
数据库来做认证，这非常有利于apiserver的横向扩展。

### 生成其它证书

密钥对还是自己生成，然后签证书时会把根证书信息带上
```go
func NewCaCertAndKeyFromRoot(cfg Config, caCert *x509.Certificate, caKey crypto.Signer) (*x509.Certificate, crypto.Signer, error) {
	key, err := NewPrivateKey(x509.UnknownPublicKeyAlgorithm)
	cert, err := NewSignedCert(cfg, key, caCert, caKey)

	return cert, key, nil
}
```

此时就必须要求有CommonName了，Usages也得指定是服务端使用还是客户端使用, 注意与上面SelfSign的区别
```go
// NewSignedCert creates a signed certificate using the given CA certificate and key
func NewSignedCert(cfg Config, key crypto.Signer, caCert *x509.Certificate, caKey crypto.Signer) (*x509.Certificate, error) {
	serial, err := rand.Int(rand.Reader, new(big.Int).SetInt64(math.MaxInt64))
	if len(cfg.CommonName) == 0 {
		return nil, errors.New("must specify a CommonName")
	}
	if len(cfg.Usages) == 0 {
		return nil, errors.New("must specify at least one ExtKeyUsage")
	}

	certTmpl := x509.Certificate{
		Subject: pkix.Name{
			CommonName:   cfg.CommonName,
			Organization: cfg.Organization,
		},
		DNSNames:     cfg.AltNames.DNSNames,
		IPAddresses:  cfg.AltNames.IPs,
		SerialNumber: serial,
		NotBefore:    caCert.NotBefore,
		NotAfter:     time.Now().Add(duration365d * cfg.Year).UTC(),
		KeyUsage:     x509.KeyUsageKeyEncipherment | x509.KeyUsageDigitalSignature,
		ExtKeyUsage:  cfg.Usages,
	}
	certDERBytes, err := x509.CreateCertificate(rand.Reader, &certTmpl, caCert, key.Public(), caKey)
	return x509.ParseCertificate(certDERBytes)
}
```

### kubernetes中的所有证书

> 根证书列表

```go
var caList = []Config{
	{
		Path:         BasePath,
		BaseName:     "ca",
		CommonName:   "kubernetes",
		Organization: nil,
		Year:         100,
		AltNames:     AltNames{},
		Usages:       nil,
	},
	{
		Path:         BasePath,
		BaseName:     "front-proxy-ca",
		CommonName:   "front-proxy-ca",
		Organization: nil,
		Year:         100,
		AltNames:     AltNames{},
		Usages:       nil,
	},
	{
		Path:         EtcdBasePath,
		BaseName:     "ca",
		CommonName:   "etcd-ca",
		Organization: nil,
		Year:         100,
		AltNames:     AltNames{},
		Usages:       nil,
	},
}
```

其它签名证书列表
```go
var certList = []Config{
	{
		Path:         BasePath,
		BaseName:     "apiserver",
		CAName:       "kubernetes",
		CommonName:   "kube-apiserver",
		Organization: nil,
		Year:         100,
		AltNames:     AltNames{// 实际安装时还需要把服务器IP用户自定义域名加上
			DNSNames: []string{  
				"apiserver.cluster.local",
				"localhost",
				"master",
				"kubernetes",
				"kubernetes.default",
				"kubernetes.default.svc",
			},
			IPs: []net.IP{
				{127,0,0,1},
			},
		},
		Usages:       []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth}, // 用途是服务端校验
	},
	{
		Path:         BasePath,
		BaseName:     "apiserver-kubelet-client",
		CAName:       "kubernetes",
		CommonName:   "kube-apiserver-kubelet-client",
		Organization: []string{"system:masters"},
		Year:         100,
		AltNames:     AltNames{},
		Usages:       []x509.ExtKeyUsage{x509.ExtKeyUsageClientAuth},
	},
	{
		Path:         BasePath,
		BaseName:     "front-proxy-client",
		CAName:       "front-proxy-ca",
		CommonName:   "front-proxy-client",
		Organization: nil,
		Year:         100,
		AltNames:     AltNames{},
		Usages:       []x509.ExtKeyUsage{x509.ExtKeyUsageClientAuth},
	},
	{
		Path:         BasePath,
		BaseName:     "apiserver-etcd-client",
		CAName:       "etcd-ca",
		CommonName:   "kube-apiserver-etcd-client",
		Organization: []string{"system:masters"},
		Year:         100,
		AltNames:     AltNames{},
		Usages:       []x509.ExtKeyUsage{x509.ExtKeyUsageClientAuth},
	},
	{
		Path:         EtcdBasePath,
		BaseName:     "server",
		CAName:       "etcd-ca",
		CommonName:   "etcd", // kubeadm etcd server证书common name使用节点名，这也是调用时需要改动的
		Organization: nil,
		Year:         100,
		AltNames:     AltNames{}, // 调用时需要把节点名，节点IP等加上
		Usages:       []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth, x509.ExtKeyUsageClientAuth},
	},
	{
		Path:         EtcdBasePath,
		BaseName:     "peer",
		CAName:       "etcd-ca",
		CommonName:   "etcd-peer", // 与etcd server同理
		Organization: nil,
		Year:         100,
		AltNames:     AltNames{}, // 与etcd server同理
		Usages:       []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth, x509.ExtKeyUsageClientAuth},
	},
	{
		Path:         EtcdBasePath,
		BaseName:     "healthcheck-client",
		CAName:       "etcd-ca",
		CommonName:   "kube-etcd-healthcheck-client",
		Organization: []string{"system:masters"},
		Year:         100,
		AltNames:     AltNames{},
		Usages:       []x509.ExtKeyUsage{x509.ExtKeyUsageClientAuth},
	},
}
```
上面非常要注意的是server端校验的证书安装时需要把IP 和域名加上，etcd的commonName也要设置成node name。

看最后生成的证书信息：

apiserver:
```go
[root@iZ2ze4ry74x8bh3cweeg69Z pki]# openssl x509 -in /etc/kubernetes/pki/apiserver.crt -text -noout
Certificate:
...
    Signature Algorithm: sha256WithRSAEncryption
        Issuer: CN=kubernetes
        Validity
            Not Before: Mar 31 09:18:06 2020 GMT
            Not After : Mar  8 09:18:06 2119 GMT
        Subject: CN=kube-apiserver
...
        X509v3 extensions:
            X509v3 Key Usage: critical
                Digital Signature, Key Encipherment
            X509v3 Extended Key Usage: 
                TLS Web Server Authentication
            X509v3 Subject Alternative Name: 
                DNS:iz2ze4ry74x8bh3cweeg69z, DNS:kubernetes, DNS:kubernetes.default, DNS:kubernetes.default.svc, DNS:kubernetes.default.svc.cluster.local, DNS:apiserver.cluster.local, DNS:apiserver.cluster.local, IP Address:10.96.0.1, IP Address:172.16.9.192, IP Address:127.0.0.1, IP Address:172.16.9.192, IP Address:172.16.9.193, IP Address:172.16.9.194, IP Address:10.103.97.2
    Signature Algorithm: sha256WithRSAEncryption
```

etcd server:
```go
[root@iZ2ze4ry74x8bh3cweeg69Z pki]# openssl x509 -in /etc/kubernetes/pki/etcd/server.crt -text -noout
Certificate:
    Data:
        Version: 3 (0x2)
        Serial Number: 1930981199811083392 (0x1acc392ba2b27c80)
    Signature Algorithm: sha256WithRSAEncryption
        Issuer: CN=etcd-ca
        Validity
            Not Before: Mar 31 09:18:07 2020 GMT
            Not After : Mar  8 09:18:07 2119 GMT
        Subject: CN=iz2ze4ry74x8bh3cweeg69z
...
            X509v3 Extended Key Usage: 
                TLS Web Server Authentication, TLS Web Client Authentication
            X509v3 Subject Alternative Name: 
                DNS:iz2ze4ry74x8bh3cweeg69z, DNS:localhost, IP Address:172.16.9.192, IP Address:127.0.0.1, IP Address:0:0:0:0:0:0:0:1
    Signature Algorithm: sha256WithRSAEncryption
```

## 生成用户证书和kubeconfig

现在有个实习生fanux来公司了，也想用用k8s，果断不放心把admin 的kubeconfig交给他，那怎么办？
有了上面基础，再进一步教你怎么为fanux分配一个单独的kubeconfig


1. 从磁盘加载根证书,和私钥
2. 生成fanux这个用户的证书, common name就是fanux
3. 编码成pem格式
4. 写kubeconfig, 写磁盘
```go
func GenerateKubeconfig(conf Config) error{
	certs, err := cert.CertsFromFile(conf.CACrtFile)
	caCert := certs[0]
	cert := EncodeCertPEM(caCert)
	caKey,err := TryLoadKeyFromDisk(conf.CAKeyFile)
    // 这里conf.User就是fanux, conf.Groups就是用户组，可以是多个
	clientCert,clientKey,err := NewCertAndKey(caCert,caKey,conf.User,conf.Groups,conf.DNSNames,conf.IPAddresses)
	encodedClientKey,err := keyutil.MarshalPrivateKeyToPEM(clientKey)
	encodedClientCert := EncodeCertPEM(clientCert)
    // 构建kubeconfig的三元组信息
	config := &api.Config{
		Clusters: map[string]*api.Cluster{
			conf.ClusterName: {
				Server: conf.Apiserver, // 集群地址 如 https://apiserver.cluster.local:6443
				CertificateAuthorityData: cert, // pem格式的根证书，用于https
			},
		},
		Contexts: map[string]*api.Context{
			ctx: {            // 三元组信息，用户名 fanux, 上面的cluster名，以及namespace这里没写
				Cluster:  conf.ClusterName, 
				AuthInfo: conf.User,
			},
		},
		AuthInfos:      map[string]*api.AuthInfo{  // 用户信息, 所以你直接改kubeconfig里的user是没用的，因为k8s只认证书里的名字
			conf.User:&api.AuthInfo{
				ClientCertificateData: encodedClientCert,  // pem格式的用户证书
				ClientKeyData:         encodedClientKey,   // pem格式的用户私钥
			},
		},
		CurrentContext: ctx,  // 当前上下文, kubeconfig可以很好支持多用户和多集群
	}

	err = clientcmd.WriteToFile(*config, conf.OutPut)
	return nil
}
```

用户证书和私钥生成, 和上面签名证书一样，user就是fanux, group是用户组：
```go
func NewCertAndKey(caCert *x509.Certificate, caKey crypto.Signer, user string, groups []string, DNSNames []string,IPAddresses []net.IP) (*x509.Certificate, crypto.Signer, error) {
	key,err := rsa.GenerateKey(rand.Reader, 2048)
	serial, err := rand.Int(rand.Reader, new(big.Int).SetInt64(math.MaxInt64))

	certTmpl := x509.Certificate{
		Subject: pkix.Name{
			CommonName:   user,
			Organization: groups,
		},
		DNSNames:     DNSNames,
		IPAddresses:  IPAddresses,
		SerialNumber: serial,
		NotBefore:    caCert.NotBefore,
		NotAfter:     time.Now().Add(time.Hour * 24 * 365 * 99).UTC(),
		KeyUsage:     x509.KeyUsageKeyEncipherment | x509.KeyUsageDigitalSignature,
		ExtKeyUsage:  []x509.ExtKeyUsage{x509.ExtKeyUsageClientAuth},
	}
	certDERBytes, err := x509.CreateCertificate(rand.Reader, &certTmpl, caCert, key.Public(), caKey)
	cert,err := x509.ParseCertificate(certDERBytes)
	return cert,key,nil
}
```

然后这位小伙伴的kubeconfig就生成了，此时没有任何权限：
```go
kubectl --kubeconfig ./kube/config get pod
Error from server (Forbidden): pods is forbidden: User "fanux" cannot list resource "pods" in API group ...
```

最后发挥一下RBAC就可以了，这里就直接绑定个管理员权限了
```go
kind: ClusterRoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: user-admin-test
subjects:
- kind: User
  name: "fanux" # Name is case sensitive
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: cluster-admin  # using admin role
  apiGroup: rbac.authorization.k8s.io
```

# 总结

证书与k8s的认证原理在集群安装以及开发多租户容器平台时非常有用，希望本文能让大家有个整体细致全面的了解。