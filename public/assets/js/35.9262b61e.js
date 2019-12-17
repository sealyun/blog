(window.webpackJsonp=window.webpackJsonp||[]).push([[35],{351:function(s,t,a){"use strict";a.r(t);var n=a(0),e=Object(n.a)({},(function(){var s=this,t=s.$createElement,a=s._self._c||t;return a("ContentSlotsDistributor",{attrs:{"slot-key":s.$parent.slotKey}},[a("h1",{attrs:{id:"kubernetes-admission-controller原理介绍"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#kubernetes-admission-controller原理介绍"}},[s._v("#")]),s._v(" kubernetes Admission Controller原理介绍")]),s._v(" "),a("blockquote",[a("p",[s._v("Admission Controller介绍")])]),s._v(" "),a("p",[s._v("Apiserver干的最重要的三个事就是：")]),s._v(" "),a("ol",[a("li",[s._v("认证 : 看是否是合法用户")]),s._v(" "),a("li",[s._v("授权 : 看用户具备哪些权限")]),s._v(" "),a("li",[s._v("admission controller : 一个调用链，对请求进行控制或修改，比如是否允许这个请求。")])]),s._v(" "),a("p",[s._v("admission controller非常有用，也是经常会用到的k8s的一个扩展方式，今天在源码级别对其做一下介绍，以及如何自己去开发一个admission controller.")]),s._v(" "),a("p",[s._v("我们的应用场景是：我们希望把所有需要创建的pod都加上一个注解，因为我们早期是通过podpreset给pod注入lxcfs的配置的，但是用户在写yaml文件时很容易忘记加上，所以需要在apiserver上来个自动处理\n")]),s._v(" "),a("div",{staticClass:"language- line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[s._v('metadata:\n  name: test-net\n  annotations:\n    initializer.kubernetes.io/lxcfs: "true"   # 就是在pod的metadata里加上这个配置\n')])]),s._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[s._v("1")]),a("br"),a("span",{staticClass:"line-number"},[s._v("2")]),a("br"),a("span",{staticClass:"line-number"},[s._v("3")]),a("br"),a("span",{staticClass:"line-number"},[s._v("4")]),a("br")])]),a("h2",{attrs:{id:"默认admission-controller"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#默认admission-controller"}},[s._v("#")]),s._v(" 默认admission controller")]),s._v(" "),a("p",[s._v("已经有很多默认非常有用的admission插件，这里挑几个介绍一下：")]),s._v(" "),a("table",[a("thead",[a("tr",[a("th",[s._v("名称")]),s._v(" "),a("th",[s._v("作用")])])]),s._v(" "),a("tbody",[a("tr",[a("td",[s._v("AlwaysPullImages")]),s._v(" "),a("td",[s._v("把所有镜像策略都调整成alwaysPull, 多租户安全时比较有用")])]),s._v(" "),a("tr",[a("td",[s._v("DefaultStorageClass")]),s._v(" "),a("td",[s._v("默认存储类型")])]),s._v(" "),a("tr",[a("td",[s._v("DefaultTolerationSeconds")]),s._v(" "),a("td",[s._v("节点notready:NoExecute时的容忍时间，比如有时我们升级kubelet，希望升级时pod不要漂移就会用到")])]),s._v(" "),a("tr",[a("td",[s._v("DenyEscalatingExec")]),s._v(" "),a("td",[s._v("拒绝远程连接容器")])]),s._v(" "),a("tr",[a("td",[s._v("ExtendedResourceToleration")]),s._v(" "),a("td",[s._v("比如我有扩展资源，那么我可以通过它来玷污节点，防止不需要该资源的pod到我的机器上来，如GPU")])]),s._v(" "),a("tr",[a("td",[s._v("LimitRanger")]),s._v(" "),a("td",[s._v("在多租户配额时相当有用，如果pod没配额，那么我可以默认给个很低的配额")])]),s._v(" "),a("tr",[a("td",[s._v("NamespaceAutoProvision")]),s._v(" "),a("td",[s._v("这个也非常有用，资源的namespace不存在时就创建一个")])]),s._v(" "),a("tr",[a("td",[s._v("PodPreset")]),s._v(" "),a("td",[s._v("可以对pod进行一些预处理设置")])]),s._v(" "),a("tr",[a("td",[s._v("ResourceQuota")]),s._v(" "),a("td",[s._v("多租户配额时比较重要，看资源是否满足resource quota中的配置")])])])]),s._v(" "),a("h2",{attrs:{id:"alwayspullimages-介绍"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#alwayspullimages-介绍"}},[s._v("#")]),s._v(" alwaysPullImages 介绍")]),s._v(" "),a("p",[s._v("多租户时经常会开启这个，强制所有的镜像必须去拉取，因为如果不这样，那么别的租户如果知道了你的镜像名就可以写一个yaml去启动你的镜像，强制拉时犹豫需要image pull secret所以无法拉取你的镜像。")]),s._v(" "),a("p",[s._v("所以这个admission干的事就是把镜像拉取策略都改成alwaysPull：")]),s._v(" "),a("p",[s._v("代码位置：")]),s._v(" "),a("div",{staticClass:"language-golang line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[s._v('kubernetes/plugin/pkg/admission/alwayspullimages/admission.go\n\nfunc (a *AlwaysPullImages) Admit(attributes admission.Attributes, o admission.ObjectInterfaces) (err error) {\n    // 你可以在attibutes里获取到对象的一切信息，用户信息等\n\tif shouldIgnore(attributes) { // 检查一下是不是你关注的object, 比如创建的一个configmap 那么显然可以忽视\n\t\treturn nil\n\t}\n\tpod, ok := attributes.GetObject().(*api.Pod)\n\n    // 这里把initContainer和Container的拉取策略都给改了\n\tfor i := range pod.Spec.InitContainers {\n\t\tpod.Spec.InitContainers[i].ImagePullPolicy = api.PullAlways\n\t}\n\n\tfor i := range pod.Spec.Containers {\n\t\tpod.Spec.Containers[i].ImagePullPolicy = api.PullAlways\n\t}\n\n\treturn nil\n}\n\n# 还提供一个校验接口，看是不是真的都已经被改了\nfunc (a *AlwaysPullImages) Validate(attributes admission.Attributes, o admission.ObjectInterfaces) (err error) {\n\tpod, ok := attributes.GetObject().(*api.Pod)\n\tfor i := range pod.Spec.InitContainers {\n\t\tif pod.Spec.InitContainers[i].ImagePullPolicy != api.PullAlways {\n\t\t\treturn admission.NewForbidden(attributes,\n\t\t\t\tfield.NotSupported(field.NewPath("spec", "initContainers").Index(i).Child("imagePullPolicy"),\n\t\t\t\t\tpod.Spec.InitContainers[i].ImagePullPolicy, []string{string(api.PullAlways)},\n\t\t\t\t),\n\t\t\t)\n\t\t}\n\t}\n\n    ...\n\n\treturn nil\n}\n')])]),s._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[s._v("1")]),a("br"),a("span",{staticClass:"line-number"},[s._v("2")]),a("br"),a("span",{staticClass:"line-number"},[s._v("3")]),a("br"),a("span",{staticClass:"line-number"},[s._v("4")]),a("br"),a("span",{staticClass:"line-number"},[s._v("5")]),a("br"),a("span",{staticClass:"line-number"},[s._v("6")]),a("br"),a("span",{staticClass:"line-number"},[s._v("7")]),a("br"),a("span",{staticClass:"line-number"},[s._v("8")]),a("br"),a("span",{staticClass:"line-number"},[s._v("9")]),a("br"),a("span",{staticClass:"line-number"},[s._v("10")]),a("br"),a("span",{staticClass:"line-number"},[s._v("11")]),a("br"),a("span",{staticClass:"line-number"},[s._v("12")]),a("br"),a("span",{staticClass:"line-number"},[s._v("13")]),a("br"),a("span",{staticClass:"line-number"},[s._v("14")]),a("br"),a("span",{staticClass:"line-number"},[s._v("15")]),a("br"),a("span",{staticClass:"line-number"},[s._v("16")]),a("br"),a("span",{staticClass:"line-number"},[s._v("17")]),a("br"),a("span",{staticClass:"line-number"},[s._v("18")]),a("br"),a("span",{staticClass:"line-number"},[s._v("19")]),a("br"),a("span",{staticClass:"line-number"},[s._v("20")]),a("br"),a("span",{staticClass:"line-number"},[s._v("21")]),a("br"),a("span",{staticClass:"line-number"},[s._v("22")]),a("br"),a("span",{staticClass:"line-number"},[s._v("23")]),a("br"),a("span",{staticClass:"line-number"},[s._v("24")]),a("br"),a("span",{staticClass:"line-number"},[s._v("25")]),a("br"),a("span",{staticClass:"line-number"},[s._v("26")]),a("br"),a("span",{staticClass:"line-number"},[s._v("27")]),a("br"),a("span",{staticClass:"line-number"},[s._v("28")]),a("br"),a("span",{staticClass:"line-number"},[s._v("29")]),a("br"),a("span",{staticClass:"line-number"},[s._v("30")]),a("br"),a("span",{staticClass:"line-number"},[s._v("31")]),a("br"),a("span",{staticClass:"line-number"},[s._v("32")]),a("br"),a("span",{staticClass:"line-number"},[s._v("33")]),a("br"),a("span",{staticClass:"line-number"},[s._v("34")]),a("br"),a("span",{staticClass:"line-number"},[s._v("35")]),a("br"),a("span",{staticClass:"line-number"},[s._v("36")]),a("br"),a("span",{staticClass:"line-number"},[s._v("37")]),a("br"),a("span",{staticClass:"line-number"},[s._v("38")]),a("br")])]),a("p",[s._v("然后实现一个注册函数：")]),s._v(" "),a("div",{staticClass:"language-golang line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[s._v("func Register(plugins *admission.Plugins) {\n\tplugins.Register(PluginName, func(config io.Reader) (admission.Interface, error) {\n\t\treturn NewAlwaysPullImages(), nil\n\t})\n}\n\ntype AlwaysPullImages struct {\n\t*admission.Handler\n}\n")])]),s._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[s._v("1")]),a("br"),a("span",{staticClass:"line-number"},[s._v("2")]),a("br"),a("span",{staticClass:"line-number"},[s._v("3")]),a("br"),a("span",{staticClass:"line-number"},[s._v("4")]),a("br"),a("span",{staticClass:"line-number"},[s._v("5")]),a("br"),a("span",{staticClass:"line-number"},[s._v("6")]),a("br"),a("span",{staticClass:"line-number"},[s._v("7")]),a("br"),a("span",{staticClass:"line-number"},[s._v("8")]),a("br"),a("span",{staticClass:"line-number"},[s._v("9")]),a("br")])]),a("p",[s._v("最后需要在plugin里面把其注册进去：")]),s._v(" "),a("div",{staticClass:"language- line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[s._v("kubernetes/pkg/kubeapiserver/options/plugins.go\n\nfunc RegisterAllAdmissionPlugins(plugins *admission.Plugins) {\n\timagepolicy.Register(plugins)\n    ...\n}\n")])]),s._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[s._v("1")]),a("br"),a("span",{staticClass:"line-number"},[s._v("2")]),a("br"),a("span",{staticClass:"line-number"},[s._v("3")]),a("br"),a("span",{staticClass:"line-number"},[s._v("4")]),a("br"),a("span",{staticClass:"line-number"},[s._v("5")]),a("br"),a("span",{staticClass:"line-number"},[s._v("6")]),a("br")])]),a("p",[s._v("所以实现一个admission非常简单，主要就是实现两个接口即可。")]),s._v(" "),a("h2",{attrs:{id:"admission-control-webhooks"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#admission-control-webhooks"}},[s._v("#")]),s._v(" admission control webhooks")]),s._v(" "),a("p",[s._v("很多情况下我们并不希望大动干戈去改apiserver代码，所以apiserver提供了一种动态扩展admission的方式，非常推荐。")]),s._v(" "),a("p",[s._v("有两种类型：")]),s._v(" "),a("ol",[a("li",[s._v("validating admission Webhook  只作校验，比如检测到某个特殊字段就不让请求通过")]),s._v(" "),a("li",[s._v("mutating admission webhook    可以对请求体进行修改（patch）")])]),s._v(" "),a("p",[s._v("比较重要的是这个AdmissionReview结构体，包含一个请求一个响应")]),s._v(" "),a("p",[s._v("请求：有Object的详细信息，用户信息\n响应: 最重要的是 1. 是否允许  2. 修改（patch）的类型  3. 修改（patch）的值， 这个符合json patch标准 （kubectl patch）")]),s._v(" "),a("p",[s._v("可"),a("a",{attrs:{href:"https://github.com/kubernetes/kubernetes/blob/v1.13.0/test/images/webhook/main.go",target:"_blank",rel:"noopener noreferrer"}},[s._v("在此"),a("OutboundLink")],1),s._v(" 找到一个webhook server的例子")]),s._v(" "),a("p",[s._v("看一个具体例子，labelpatch，是给对象的元数据里加一些label的。")]),s._v(" "),a("div",{staticClass:"language-go line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-go"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("const")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("\n    "),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("// 特定的json patch格式")]),s._v("\n\taddFirstLabelPatch "),a("span",{pre:!0,attrs:{class:"token builtin"}},[s._v("string")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[s._v('`[\n         { "op": "add", "path": "/metadata/labels", "value": {"added-label": "yes"}}\n     ]`')]),s._v("\n\taddAdditionalLabelPatch "),a("span",{pre:!0,attrs:{class:"token builtin"}},[s._v("string")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[s._v('`[\n         { "op": "add", "path": "/metadata/labels/added-label", "value": "yes" }\n     ]`')]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v("\n\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v('// Add a label {"added-label": "yes"} to the object')]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("func")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token function"}},[s._v("addLabel")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("ar v1beta1"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(".")]),s._v("AdmissionReview"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("*")]),s._v("v1beta1"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(".")]),s._v("AdmissionResponse "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n\tobj "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":=")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("struct")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n\t\tmetav1"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(".")]),s._v("ObjectMeta\n\t\tData "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("map")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("[")]),a("span",{pre:!0,attrs:{class:"token builtin"}},[s._v("string")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("]")]),a("span",{pre:!0,attrs:{class:"token builtin"}},[s._v("string")]),s._v("\n\t"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v("\n\traw "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":=")]),s._v(" ar"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(".")]),s._v("Request"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(".")]),s._v("Object"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(".")]),s._v("Raw\n\terr "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":=")]),s._v(" json"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[s._v("Unmarshal")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("raw"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("&")]),s._v("obj"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v("\n\t"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("if")]),s._v(" err "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("!=")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token boolean"}},[s._v("nil")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n\t\tklog"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[s._v("Error")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("err"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v("\n\t\t"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("return")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token function"}},[s._v("toAdmissionResponse")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("err"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v("\n\t"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v("\n\n\treviewResponse "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":=")]),s._v(" v1beta1"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(".")]),s._v("AdmissionResponse"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v("\n\treviewResponse"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(".")]),s._v("Allowed "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token boolean"}},[s._v("true")]),s._v("\n\t"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("if")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token function"}},[s._v("len")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("obj"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(".")]),s._v("ObjectMeta"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(".")]),s._v("Labels"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("==")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("0")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n\t\treviewResponse"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(".")]),s._v("Patch "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("[")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("]")]),a("span",{pre:!0,attrs:{class:"token function"}},[s._v("byte")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("addFirstLabelPatch"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("// 这里最需要注意的就是修改时是通过patch的方式")]),s._v("\n\t"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("else")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n\t\treviewResponse"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(".")]),s._v("Patch "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("[")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("]")]),a("span",{pre:!0,attrs:{class:"token function"}},[s._v("byte")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("addAdditionalLabelPatch"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v("\n\t"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v("\n\tpt "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":=")]),s._v(" v1beta1"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(".")]),s._v("PatchTypeJSONPatch\n\treviewResponse"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(".")]),s._v("PatchType "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("&")]),s._v("pt\n\t"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("return")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("&")]),s._v("reviewResponse\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v("\n")])]),s._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[s._v("1")]),a("br"),a("span",{staticClass:"line-number"},[s._v("2")]),a("br"),a("span",{staticClass:"line-number"},[s._v("3")]),a("br"),a("span",{staticClass:"line-number"},[s._v("4")]),a("br"),a("span",{staticClass:"line-number"},[s._v("5")]),a("br"),a("span",{staticClass:"line-number"},[s._v("6")]),a("br"),a("span",{staticClass:"line-number"},[s._v("7")]),a("br"),a("span",{staticClass:"line-number"},[s._v("8")]),a("br"),a("span",{staticClass:"line-number"},[s._v("9")]),a("br"),a("span",{staticClass:"line-number"},[s._v("10")]),a("br"),a("span",{staticClass:"line-number"},[s._v("11")]),a("br"),a("span",{staticClass:"line-number"},[s._v("12")]),a("br"),a("span",{staticClass:"line-number"},[s._v("13")]),a("br"),a("span",{staticClass:"line-number"},[s._v("14")]),a("br"),a("span",{staticClass:"line-number"},[s._v("15")]),a("br"),a("span",{staticClass:"line-number"},[s._v("16")]),a("br"),a("span",{staticClass:"line-number"},[s._v("17")]),a("br"),a("span",{staticClass:"line-number"},[s._v("18")]),a("br"),a("span",{staticClass:"line-number"},[s._v("19")]),a("br"),a("span",{staticClass:"line-number"},[s._v("20")]),a("br"),a("span",{staticClass:"line-number"},[s._v("21")]),a("br"),a("span",{staticClass:"line-number"},[s._v("22")]),a("br"),a("span",{staticClass:"line-number"},[s._v("23")]),a("br"),a("span",{staticClass:"line-number"},[s._v("24")]),a("br"),a("span",{staticClass:"line-number"},[s._v("25")]),a("br"),a("span",{staticClass:"line-number"},[s._v("26")]),a("br"),a("span",{staticClass:"line-number"},[s._v("27")]),a("br"),a("span",{staticClass:"line-number"},[s._v("28")]),a("br"),a("span",{staticClass:"line-number"},[s._v("29")]),a("br"),a("span",{staticClass:"line-number"},[s._v("30")]),a("br"),a("span",{staticClass:"line-number"},[s._v("31")]),a("br"),a("span",{staticClass:"line-number"},[s._v("32")]),a("br"),a("span",{staticClass:"line-number"},[s._v("33")]),a("br"),a("span",{staticClass:"line-number"},[s._v("34")]),a("br")])]),a("p",[s._v("把这个放到http handle里。")]),s._v(" "),a("p",[s._v("把这个HTTPS服务起一个service, 这样apiserver就可以自动发现它。")]),s._v(" "),a("div",{staticClass:"language- line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-text"}},[a("code",[s._v('apiVersion: admissionregistration.k8s.io/v1beta1\nkind: ValidatingWebhookConfiguration\nmetadata:\n  name: <name of this configuration object>\nwebhooks:\n- name: <webhook name, e.g., pod-policy.example.io>\n  rules:                                            # 最好明确一下该hook关心哪些api，防止带来不必要的额外开销。\n  - apiGroups:\n    - ""\n    apiVersions:\n    - v1\n    operations:\n    - CREATE\n    resources:\n    - pods\n    scope: "Namespaced"\n  clientConfig:\n    service:\n      namespace: <namespace of the front-end service>  # webhook server的namespace\n      name: <name of the front-end service>            # service name\n    caBundle: <pem encoded ca cert that signs the server cert used by the webhook> # 因为需要通过https访问，所以要给apiserver配置ca\n  admissionReviewVersions:\n  - v1beta1\n  timeoutSeconds: 1\n')])]),s._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[s._v("1")]),a("br"),a("span",{staticClass:"line-number"},[s._v("2")]),a("br"),a("span",{staticClass:"line-number"},[s._v("3")]),a("br"),a("span",{staticClass:"line-number"},[s._v("4")]),a("br"),a("span",{staticClass:"line-number"},[s._v("5")]),a("br"),a("span",{staticClass:"line-number"},[s._v("6")]),a("br"),a("span",{staticClass:"line-number"},[s._v("7")]),a("br"),a("span",{staticClass:"line-number"},[s._v("8")]),a("br"),a("span",{staticClass:"line-number"},[s._v("9")]),a("br"),a("span",{staticClass:"line-number"},[s._v("10")]),a("br"),a("span",{staticClass:"line-number"},[s._v("11")]),a("br"),a("span",{staticClass:"line-number"},[s._v("12")]),a("br"),a("span",{staticClass:"line-number"},[s._v("13")]),a("br"),a("span",{staticClass:"line-number"},[s._v("14")]),a("br"),a("span",{staticClass:"line-number"},[s._v("15")]),a("br"),a("span",{staticClass:"line-number"},[s._v("16")]),a("br"),a("span",{staticClass:"line-number"},[s._v("17")]),a("br"),a("span",{staticClass:"line-number"},[s._v("18")]),a("br"),a("span",{staticClass:"line-number"},[s._v("19")]),a("br"),a("span",{staticClass:"line-number"},[s._v("20")]),a("br"),a("span",{staticClass:"line-number"},[s._v("21")]),a("br"),a("span",{staticClass:"line-number"},[s._v("22")]),a("br"),a("span",{staticClass:"line-number"},[s._v("23")]),a("br"),a("span",{staticClass:"line-number"},[s._v("24")]),a("br")])]),a("h2",{attrs:{id:"总结"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#总结"}},[s._v("#")]),s._v(" 总结")]),s._v(" "),a("p",[s._v("adminssion control 是非常重要的APIserver扩展的方式，掌握了其开发很多地方就能以比较优雅的方式解决一些实际问题。是基于k8s开发PaaS平台的利器")]),s._v(" "),a("p",[s._v("探讨可加QQ群：98488045")])])}),[],!1,null,null,null);t.default=e.exports}}]);