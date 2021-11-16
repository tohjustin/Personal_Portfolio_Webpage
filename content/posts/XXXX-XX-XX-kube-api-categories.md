---
title: "kube-api-categories: A CLI tool for discovering Kubernetes API categories"
description: "kube-api-categories is a CLI tool that allows users to discover Kubernetes API categories."
date: 2021-12-01T00:00:00+08:00
tags: [kube-api-categories, kubectl-plugin, kubernetes]
draft: true
---

[kube-api-categories](https://github.com/tohjustin/kube-api-categories) is a CLI tool for discovering Kubernetes API categories.

```text
$ kubectl api-categories
RESOURCE                          APIGROUP                       NAMESPACED   CATEGORIES
bindings                                                         true         []
componentstatuses                                                false        []
configmaps                                                       true         []
endpoints                                                        true         []
events                                                           true         []
limitranges                                                      true         []
namespaces                                                       false        []
nodes                                                            false        []
persistentvolumeclaims                                           true         []
persistentvolumes                                                false        []
pods                                                             true         [all]
podtemplates                                                     true         []
replicationcontrollers                                           true         [all]
resourcequotas                                                   true         []
secrets                                                          true         []
serviceaccounts                                                  true         []
services                                                         true         [all]
mutatingwebhookconfigurations     admissionregistration.k8s.io   false        [api-extensions]
validatingwebhookconfigurations   admissionregistration.k8s.io   false        [api-extensions]
customresourcedefinitions         apiextensions.k8s.io           false        [api-extensions]
...
```

You can install kube-api-categories as a kubectl plugin using the [krew plugin manager](https://krew.sigs.k8s.io/).

```text
kubectl krew index add tohjustin https://github.com/tohjustin/kubectl-plugins.git
kubectl krew install tohjustin/api-categories
```

## Motivation

- Talk about `kubectl get all`, where the all came from
- Define API Categories
- No easy way to fetch all the category info

## Kubernetes API Categories

- Origin of `categories` field

## Interesting discoveries

- Interesting findings from this tool (maybe via a Sourcegraph query)

## What's next?

This project is more or less feature complete & since it's rather simple, I have only published it on my custom plugin index at [tohjustin/kubectl-plugins](https://github.com/tohjustin/kubectl-plugins).

However I would still love to get feedback on how to improve `kube-api-categories`. If you have any feature suggestion or want to propose a new input/output format for the tool, do feel free to create an issue on the project's [GitHub issue page](https://github.com/tohjustin/kube-api-categories/issues) or reach out to me on [Twitter](https://twitter.com/tohjustin_)! 🙂
