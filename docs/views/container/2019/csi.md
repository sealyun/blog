# CSI详解

1.简介
2.开发Kubernetes的CSI driver
  2.1.Sidecar容器
    2.1.1.Kubernetes兼容性
    2.1.2.external-attacher
    2.1.3.external-provisioner
    2.1.4.external-resizer
    2.1.5.external-snapshotter
    2.1.6.livenessprobe
    2.1.7.node-driver-registrar
    2.1.8.cluster-driver-registrar
  2.2.CSI对象
    2.2.1.CSIDriver对象
    2.2.2.CSINode对象
  2.3.特性
    2.3.1.密钥和凭据
    2.3.1.1.StorageClass的秘密
    2.3.1.2.VolumeSnapshotClass的秘密
    2.3.2.拓扑结构
    2.3.3.原始块体积
    2.3.4.跳过附加
    2.3.5.挂载上的Pod信息
    2.3.6.体积扩大
    2.3.7.数据源
    2.3.7.1.克隆
    2.3.7.2.卷快照和还原
    2.3.8.临时本地卷
3.在Kubernetes上部署CSI驱动程序
  3.1.例
4.驱动程序测试
  4.1.单元测试
  4.2.功能测试
5.驱动程序
6.故障排除

# 简介
本文详细介绍如何在Kubernetes上开发，部署和测试容器存储接口（CSI）驱动程序. CSI允许用户在不修改kubernetes代码的前提下实现对接容器存储。

Kubelet 通过Unix域套接字直接向CSI驱动程序发出CSI调用（例如NodeStageVolume，NodePublishVolume等），以装载和卸载卷。
Kubelet通过kubelet插件注册机制发现CSI驱动程序（以及用于与CSI驱动程序进行交互的Unix域套接字）。
因此，部署在Kubernetes上的所有CSI驱动程序必须在每个受支持的节点上使用kubelet插件注册机制进行注册。

Kubernetes master组件不会直接（通过Unix域套接字或其他方式）与CSI驱动程序通信。
因此，需要依赖于Kubernetes API的操作的CSI驱动程序（例如卷创建，卷附加，卷快照等）必须监听Kubernetes API并针对它触发适当的CSI操作。

k8s存储团队提供了一些可复用的组件来帮助我们简化CSI开发，包括以下几个组件：

* Kubernetes CSI sidecar
* Kubernetes CSI 对象
* CSI 测试工具

# 开发Kubernetes的CSI driver
## Sidecar 容器
Kubernetes CSI Sidecar容器是一组标准容器，旨在简化Kubernetes上CSI驱动程序的开发和部署。

这些容器包含监听Kubernetes API的通用逻辑，针对“ CSI卷driver”容器触发适当的操作，并根据需要更新Kubernetes API。

这些容器旨在与第三方CSI驱动程序容器捆绑在一起，并作为Pod一起部署。

容器由Kubernetes Storage社区开发和维护。

容器的使用严格是可选的，强烈建议使用。

这些边柜的优点包括：

减少重复代码。
CSI驱动程序开发人员不必担心复杂的“Kubernetes相关”的代码。
关注点分离。
与Kubernetes API交互的代码与实现CSI接口的代码隔离（在另一个容器中）。
Kubernetes开发团队维护以下Kubernetes CSI Sidecar容器：

* external-provisioner
* external-attacher
* external-snapshotter
* external-resizer
* node-driver-registrar
* livenessprobe

### 兼容性
[详细的兼容性信息查看此链接](https://kubernetes-csi.github.io/docs/external-attacher.html)

### [external-attacher](https://github.com/kubernetes-csi/external-attacher/blob/master/README.md) 

external-attacher是一个sidecar容器，监听VolumeAttachment，它通过CSI驱动程序的调用ControllerPublish和ControlerUnpublish功能将卷附加到节点。因为在Kubernetes控制器管理器中运行的内部Attach / Detach控制器没有与CSI driver的任何直接接口。

比如挂载ceph时，我们先把ceph卷挂载到机器上，就是通过此接口实现. 所以这两操作一般是在机器上挂在网络块存储，如iSCSI就不走这个接口了.

如果是iSCSI通常是通过NodeStage NodeUnstage CSI接口调用

### [external-provisioner](https : //github.com/kubernetes-csi/external-provisioner)

用于监视PersistentVolumeClaim用户创建的对象并为其创建/删除卷

它调用CreateVolume 在指定节点创建新的卷

PersistentVolumeClaim如果PVC引用了Kubernetes StorageClass，storage class provisioner 字段匹配上了CSI 的GetPluginInfo返回值,一旦成功划分卷，sidecar容器就会创建一个PersistentVolume来描述这个刚创建的卷

根据删除回收策略决定删除PVC时要不要删除PV

数据源
外部供应商提供了在供应期间请求从数据源预填充卷的功能。有关如何处理数据源的更多信息，请参见DataSources。

快照
CSI external-provisioner支持Snapshot数据源。如果将SnapshotCRD指定为PVC对象上的数据源，则sidecar容器通过获取SnapshotContent对象来获取有关快照的信息，并在结果CreateVolume调用中填充数据源字段，以指示存储系统应填充新卷使用指定的快照。

PersistentVolumeClaim（克隆）
还可以通过在Provision请求的DataSource字段中指定kind:type of 来实现克隆PersistentVolumeClaim。外部供应商负责验证DataSource对象中指定的声明是否存在，与要供应的卷处于同一存储类中，以及声明当前是否存在Bound。

StorageClass参数
设置新卷时，CSI external-provisioner将map<string, string> parametersCSI CreateVolumeRequest调用中的字段设置为StorageClass正在处理的键/值。

CSI external-provisioner（v1.0.1 +）还保留带有前缀的参数密钥csi.storage.k8s.io/。带有前缀的任何键csi.storage.k8s.io/都不会作为opaque传递给CSI驱动程序parameter。

以下保留的StorageClass参数键触发CSI中的行为external-provisioner：

csi.storage.k8s.io/provisioner-secret-name
csi.storage.k8s.io/provisioner-secret-namespace
csi.storage.k8s.io/controller-publish-secret-name
csi.storage.k8s.io/controller-publish-secret-namespace
csi.storage.k8s.io/node-stage-secret-name
csi.storage.k8s.io/node-stage-secret-namespace
csi.storage.k8s.io/node-publish-secret-name
csi.storage.k8s.io/node-publish-secret-namespace
csi.storage.k8s.io/fstype
如果PVC VolumeMode设置为Filesystem，并且csi.storage.k8s.io/fstype指定的值，则将其用于填充FsTypein CreateVolumeRequest.VolumeCapabilities[x].AccessType并将AccessType设置为Mount。

有关如何处理机密的更多信息，请参见“ 机密和凭据”。

范例StorageClass：


apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: gold-example-storage
provisioner: exampledriver.example.com
parameters:
  disk-type: ssd
  csi.storage.k8s.io/fstype: ext4
  csi.storage.k8s.io/provisioner-secret-name: mysecret
  csi.storage.k8s.io/provisioner-secret-namespace: mynamespace
用法
支持动态卷配置的CSI驱动程序应使用此sidecar容器，并通告CSI CREATE_DELETE_VOLUME控制器功能。

有关详细信息（二进制参数，RBAC规则等），请参见https://github.com/kubernetes-csi/external-provisioner/blob/master/README.md。

部署方式
CSI external-provisioner被部署为控制器。有关更多详细信息，请参见部署部分。

### [external-resizer]( https://github.com/kubernetes-csi/external-resizer)

### [external-snapshotter](https://github.com/kubernetes-csi/external-snapshotter)

### [livenessprobe](https://github.com/kubernetes-csi/livenessprobe)

### [node-driver-registrar](https://github.com/kubernetes-csi/node-driver-registrar)

## CSI objets

### CSIDriver Object
### CSINode Object

探讨可加QQ群：98488045


