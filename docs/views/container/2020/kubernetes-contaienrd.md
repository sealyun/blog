![](https://mmbiz.qpic.cn/mmbiz_png/k4U5eWO7eZNsaQCnyWsofy5lSnHMHpHEafMbYFdmla6lbkH28SKrica2BK6iaK96l95PydK9EgyQLsQngnXFa4RA/640?wx_fmt=png)

`sealos支持kubernetes+containerd离线包了`

```
# 安装一个三master的kubernetes集群
$ sealos init --passwd '123456' 
 --master 192.168.0.2  --master 192.168.0.3  --master 192.168.0.4 
 --node 192.168.0.5 
 --pkg-url /root/kube1.20.0-rc.0.tar.gz
 --version v1.20.0-rc
```

v1.20.0-rc版本离线包里完全抛弃了docker，使用了最新版本的containerd. 正式版本会和kubernetes 1.20.0正式发版时同步发出.

# docker万岁

个人十分喜欢docker，对于kubernetes的渣男行为嗤之以鼻，
然而在银子面前我们显然是没太多节操的用containerd替换掉了docker，真香。。。

其实早在1.14版本，sealos就想支持containerd了，我们认为绕开docker engine会让系统架构更轻，官方测试性能也稍好，但是一个核心问题，docker被普遍接受，以上那些理由还不足已让用户替换docker,所以我们也就没替换。

今天kubernetes帮助我们做了这个决定，虽然有点痛，但是这个结果是好的，对于有技术洁癖的人来说，适配来适配去非常不爽，大家定好标准，兼容标准就好好玩，不兼容就滚粗，标准这个东西就像两个人在一起相处的底线，你重，你丑，你不完善，都可以包容，但是你不兼容标准就真的没法一起玩。胳膊拧不过大腿，我等也只能无奈追随大势。

# 我们支持了ARM离线包

有太多用户三天两头催我们出ARM版本的包，只是对我们来说这是个尴尬的市场，用户量少，客单价低，做就是亏，然而我们小伙伴还是做了！

对自动化的极致追求也让我们可以非常方便自动化发布各种版本的ARM包。我们不知道牺牲了多少假期和肝了多少个深夜才把所有东西完善好~ 为了能躺着把钱挣了就必须花足够精力在自动化上面。

![](https://mmbiz.qpic.cn/mmbiz_png/k4U5eWO7eZNsaQCnyWsofy5lSnHMHpHEibTnuvedUMibdicSEqYiczcrrLwd4TODsYX5SdggnMlFJjEw2ZicsiaypMmg/640?wx_fmt=png)

# 一招技术变现

sealyun的出生很有意思，当年创业时注册的域名sealyun.com，直到创业失败也没找到合适的用途，后来工作时发现安装kubernetes挺麻烦，就写了一个破脚本放到了阿里云市场上：
![](https://mmbiz.qpic.cn/mmbiz_png/k4U5eWO7eZNsaQCnyWsofy5lSnHMHpHEN6hzAaP7CZEn2V0wCOBXA3wo553gZCsqQsI3MsjHGlqUwO7qWQ9zicA/640?wx_fmt=png "image.png")
没想到，真的有人愿意为技术付费，这让我有坚持做下去的理由。而且早期确实受到了非常多用户的鼓舞，那个时候真的非常开心：
![](https://mmbiz.qpic.cn/mmbiz_png/k4U5eWO7eZNsaQCnyWsofy5lSnHMHpHEMxAKgphjTxECDaJIaMHTfnvvod0cBz45JSn1J1xGyWB6bx7w4QOA3w/640?wx_fmt=png "image.png")
那个时候有几件事记忆犹新：

每天晚上写代码到12点左右，12点之后就一个用户一个用户的发短信问他们的使用体验，让他们加群。起初有非常多的问题，几乎没有哪个用户能一次就安装上，看电影时，买菜时都在支持用户，优化了很多个版本后诞生了sealos，中间经历了shell的版本ansible的版本，最终诞生了golang的这个终极版本。
![](https://mmbiz.qpic.cn/mmbiz_png/k4U5eWO7eZNsaQCnyWsofy5lSnHMHpHExs3pztjQ21cH25bfk28HxIl8ZpanEdbV0DYia7ibh16iatyCZCHYE91mA/640?wx_fmt=png "image.png")
这是第一个客户，各种装不上，支持了一天才搞定
![](https://mmbiz.qpic.cn/mmbiz_png/k4U5eWO7eZNsaQCnyWsofy5lSnHMHpHE7PgWOtx00LWFQAP14wNENt3aDhic0LNtThoaicztwudqtdkkzgdL6v8g/640?wx_fmt=png "image.png")

所以我觉得做出好的东西，用户会用钞票投票，现在我们拥有了几千的付费客户，很多企业用于生产环境中如51talk科大讯飞等，阿里内部也fork了sealos一个版本进行深度定制和使用。

# 你也可以售卖软件包了


sealos只是个工具，但这种技术人员变现的方式是可以复制的，所以我们新的sealyun官网上线了：

![](https://mmbiz.qpic.cn/mmbiz_png/k4U5eWO7eZNsaQCnyWsofy5lSnHMHpHEc0IpjerexnCGPJq7ETcYh1E8YJhx9icjicD5y77ntUGLbicTQWia6eC19A/640?wx_fmt=png)

意味着你可以上传一个属于你自己的软件，以相同的方式售卖，比如你可以上传一个prometheus的离线包。这样sealyun的用户可以直接购买你的软件，收益的60%归软件owner。

拿到token 用我们工具一键上传你的软件

```
$ cat test.yaml
market:
  body:
    spec:
      name: v1.19.0
      price: 0.01 # 售卖价格
      product:
        class: cloud_kernel
        productName: kubernetes
      url: https://sealyun.oss-cn-beijing.aliyuncs.com/c937a97b72d1665acf25b0b54bdc7131-1.19.0/kube1.19.0.tar.gz
    status:
      productVersionStatus: ONLINE
  kind: productVersion
$ marketctl create   --token $marketapi  -f test.yaml --logger
```

命令行的好处是可以接入到你的CI系统中，这样每次发布版本自动上传到市场上，无需人为干预实现躺着变现。

我们会严格控制软件的数量，前期只会覆盖云原生几个主流的软件，严格保证软件的质量，owner也需要经过精心的挑选。

有兴趣的小伙伴们可以联系我加入到社区中来。毕竟我们是群特别的小伙伴，特别在我们一言不合就发钱：

![](https://mmbiz.qpic.cn/mmbiz_png/k4U5eWO7eZNsaQCnyWsofy5lSnHMHpHEUUxVYicty5CR7UicLWDpiafZDoJCHIFdh7c3I9BMA9h1G2xjS2Hl77gKA/640?wx_fmt=png "image.png")
![](https://mmbiz.qpic.cn/mmbiz_png/k4U5eWO7eZNsaQCnyWsofy5lSnHMHpHE4npJIcKpWJohgVFeyia5PFkTpicHUXqjeIX0YpfRId0PSxcPuRXU8Ohg/640?wx_fmt=png "image.png")
![](https://mmbiz.qpic.cn/mmbiz_png/k4U5eWO7eZNsaQCnyWsofy5lSnHMHpHE3dJ796DUsNLNpXR7LxN05iaicL4hKxGS6TFDP1jOJPbL2gyjGmw72jCg/640?wx_fmt=png "image.png")

虽然我们挣得少，但是我们就喜欢分钱，玩法特别，灵魂有趣。

# 付费是个良性循环


开发者付出了辛勤的劳动，获得报酬理所应当，我开始做付费时被人骂过，说我拿着别人免费的东西来做付费，无耻。我不是圣人，我需要有正向的反馈才能坚持的下去，如果从一开始就免费那估计早就已经放弃了。

如果这是个免费的项目，我就不可能自费把离线包放到oss上让用户有更好的下载体验。
也不可能投入广告推广产品服务更多的用户，更不可能吸引到很多小伙伴持续的投入到这项事业上来。

付费让我们屌丝开发者能够投入更多的财力去优化产品和服务体验，以更优质的产品去赢得更多客户的认可，赚取更多的利润投入产品开发，会让开源更蓬勃。

# 有趣的付费issue

有没有见过解决issue PR代码挣早饭钱滴~

![](https://mmbiz.qpic.cn/mmbiz_png/k4U5eWO7eZNsaQCnyWsofy5lSnHMHpHE8yYGG9Fp4qzFqvn5758VcyOLKTNf9gxG1NVrfcoagSPKHSkdDbxPCg/640?wx_fmt=png)

![](https://mmbiz.qpic.cn/mmbiz_png/k4U5eWO7eZNsaQCnyWsofy5lSnHMHpHEKvCFdnicuV87hBJ0nibpVeJY624EobS8Uv0uTScGUQCW0K84epdeGxsw/640?wx_fmt=png)

可能一个很小的bug,几行代码一旦PR成功，勤劳的机器人就会自动转账到你的支付宝账户，作为开发者学到了东西还有银纸是不是很开心。

# 写在最后

这一件事我坚持了四年，虽然没有做的多出色，但和我同一时期创业的很多公司都眼睁睁的看着他们一个个凉凉，现在想起来觉得他们很浮躁，以前我甚至以为他们的玩法是对的，是我太草根应该和他们一样，后来我发现不是这样，有时候一个人的本心是很强大的，不忘初心很重要，坚持自己的理念：打造优质作品，让别人知道，有盈利模式。

优质作品

首先你需要一个好的想法，想法空想是想不出来的，当你没有好的想法时你应当多去静下心学习，学习到一定的时候可能想法会冒出来，学的过程也需要思考能用这个东西来干嘛。

其次你需要苛刻的要求，乔布斯甚至连用户看不到的地方也要求极为苛刻，甚至连工厂的机器都要刷油漆，这样用户在使用他东西时就会想，连与我无关的地方都那么追求极致，那我要用的产品的那部分肯定也是非常极致完美的。  我觉得现在整个社会都非常浮躁，能真正沉下心来做事的并不多，至于我本人会非常关心用户使用接口，这个接口一定要足够简单极致。在对用户看不到的那部分的要求没那么高，这是我犯的很严重的一个错误，我觉得真的是应当在能力范围之内去要求每一行代码的完美，每一个细节的完美，这样你才能对你的作品产生爱，我挺喜欢sealos但是老想重构它，因为里面有一些细节做的不够极致。

让别人知道

让别人知道的途径有很多，最靠谱的方式还是用户口碑传播，让我很欣慰的事情是一个朋友出去参加会议，遇到一个陌生人夸了我们的产品，还有一次是公司内部有一位同事向我推荐sealos，我没好意思说是我写的。形成口碑的核心关键还是优质的作品。

有盈利模式

作为码农，我们没有社会资源，没有投资，只有手中的HHKB，所以我们唯一能活下去的方式就是自己造血，相比上面两点，这个就简单多了，像我一样卖包，企业级服务，卖教程等等。

未来希望我们的一点点努力能让整个开源社区更蓬勃的发展，助力更多开源项目活的更滋润，为开源社区注入血液培养更多优质开源项目最终为所有开发者和企业创造价值。
