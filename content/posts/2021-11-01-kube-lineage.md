---
title: "kube-lineage: A CLI tool for visualizing Kubernetes object relationships"
description: "kube-lineage is a CLI tool that allows users to view all dependents or dependencies of a given Kubernetes object so that they can better understand how objects in a cluster are related to each other."
date: 2021-11-01T21:00:00+08:00
tags: [helm, kubectl-plugin, kubernetes]
---

[kube-lineage](https://github.com/tohjustin/kube-lineage) is a CLI tool for visualizing Kubernetes object relationships. It allows users to view all dependents or dependencies of a given Kubernetes object so that they can better understand how objects in a cluster are related to each other.

```text
$ kubectl lineage clusterrole/system:metrics-server
NAMESPACE     NAME                                                     READY   STATUS    AGE
              ClusterRole/system:metrics-server                        -                 5m
              └── ClusterRoleBinding/system:metrics-server             -                 5m
kube-system       └── ServiceAccount/metrics-server                    -                 5m
kube-system           ├── Pod/metrics-server-7b4f8b595-8m7rz           1/1     Running   5m
kube-system           │   └── Service/metrics-server                   -                 5m
                      │       ├── APIService/v1beta1.metrics.k8s.io    True              5m
kube-system           │       └── EndpointSlice/metrics-server-wb2cm   -                 5m
kube-system           └── Secret/metrics-server-token-nqw85            -                 5m
kube-system               └── Pod/metrics-server-7b4f8b595-8m7rz       1/1     Running   5m
```

You can install kube-lineage as a kubectl plugin using the [krew plugin manager](https://krew.sigs.k8s.io/).

```text
kubectl krew install lineage
```

## Motivation

`kubectl` is the primary tool that most users use to interact with their Kubernetes cluster. Since it doesn't have a built-in command to display related Kubernetes objects in a cluster, understanding how each them are related to one another isn't straightforward task.

Just a few months ago, I discovered [kubectl-tree](https://github.com/ahmetb/kubectl-tree) — a kubectl plugin that helps to visualize [object ownership](https://kubernetes.io/docs/concepts/overview/working-with-objects/owners-dependents/) in a similar manner to the [tree](https://en.wikipedia.org/wiki/Tree_(command)) command found in most operating systems.

```text
$ kubectl tree deployment traefik
NAMESPACE    NAME                             READY  REASON  AGE
kube-system  Deployment/traefik               -              14d
kube-system  └─ReplicaSet/traefik-5dd496474   -              14d
kube-system    └─Pod/traefik-5dd496474-cr6d8  True           14d
```

It allows users to view all the dependents of a given Kubernetes object with a single command. The tool was a game changer for me as I discovered lots of new owner-dependent relationships that I wasn't aware of:

- `ControllerRevision` being used by `DaemonSet` & `StatefulSet` for updates & rollbacks.
- `Lease` being used to represent `Node` heartbeats (see [Efficient Node Heartbeats KEP](https://github.com/kubernetes/enhancements/blob/master/keps/sig-node/589-efficient-node-heartbeats/README.md)).

However I also discovered a lot of new questions that the tool wasn't able to answer:

> "Which resources are referencing this Secret?"
>
> "Which Pods are using this ServiceAccount?"
>
> "Which ServiceAccounts are bound to this ClusterRole?"
>
> "Are there any Ingresses or ValidatingWebhookConfigurations dependent on this Pod?"

Some of the questions could definitely answered by other existing kubectl-plugins, but I was hoping for a single tool to answer all of them & hence I decided to build one myself as I could find any alternatives out there.

## Initial Research

I started off with finding whether there were any existing APIs in the Kubernetes control plane that I could use for object relationship discovery. The garbage collector controller was a promising candidate as it tracked the ownership of all objects in the cluster & the data is accessible via an API:

```text
$ kubectl get --raw /debug/controllers/garbagecollector/graph --server=$KUBE_CONTROLLER_MANAGER
strict digraph full {
  // Node definitions.
  0 [
    label="\"uid=dd415bed-dcdb-45fb-ad8e-9c946171cf1c\nnamespace=kube-system\nPod.v1/coredns-7448499f4d-zn8cl\n\""
    group=""
    version="v1"
    kind="Pod"
    namespace="kube-system"
    name="coredns-7448499f4d-zn8cl"
    uid="dd415bed-dcdb-45fb-ad8e-9c946171cf1c"
...
```

However it wasn't feasible for the following reasons:

1. The endpoint is meant for debugging purposes: The output format can change anytime & I wasn't sure if it is available on all Kubernetes distributions.
2. Accessing the endpoint requires admin-level privileges: A deal-breaker if I wanted the tool to work for any users with `kubectl` access.
3. It can only discover owner-dependent relationships.

## Implementation

I ended up copying kubectl-tree's approach, which can be summarized into these four steps:

1. List all available API resources in the cluster.
2. For each available API resource, list all objects.
3. For each object, scan through its fields & construct a relationship graph where each node in the graph would represent a Kubernetes object.
4. Print out all the nodes in the graph that are connected to the "root node" (i.e. the node that corresponds to Kubernetes object specified in the command argument).

The main difference in kube-lineage's implementation is in step #3. Instead of only looking at the `.metadata.ownerReferences` field of every object to identify owner-dependent relationships, we additionally implement custom logic for each Kubernetes resource type to discover other forms of relationships. For example:

- When handling a `events.v1` object, we look at its `involvedobject.uid` field & mark the object with matching UID as related to the event object.
- When handling a `services.v1` object, we look at its `spec.selector` field, find all the pods in the service's namespace that matches the selector & mark all of them as related to the service object.

## Adding Helm Support

Now that we have the ability to visualize object relationships in the cluster, I had a new question that I wanted to answer regarding [Helm](https://helm.sh/docs/helm/helm_get_manifest/#helm), the de facto package manager for Kubernetes:

> "What are the list of resources associated to a specific Helm release?"

Since a [Helm release](https://helm.sh/docs/glossary/#release) isn't an actual Kubernetes resource but a construct that exists only in Helm, we needed either a new input format or flag for our command to specify a Helm release instead of a Kubernetes object.

One of the design goal that I had from the start was to reduce the initial learning curve for users, hence I intentionally made the input formats & flags of the command as similar to `kubectl get` as possible to. To avoid overloading the existing command with a new input format or flag(s), a separate `helm` subcommand was created for this feature instead.

The `helm` subcommand uses a rather similar implementation:

1. List all Kubernetes objects associated with the specified Helm release.
2. List all available API resources in the cluster.
3. For each available API resource, list all objects.
4. For each object, scan through its fields & construct a relationship graph.
5. Print out all the nodes in the graph that are connected to the "root nodes" (i.e. this time round, the nodes are Kubernetes objects associated with the Helm release).

In Helm 3, we can obtain the list of associated Kubernetes objects via the generated manifest for a given release. For those that aren't familiar with Helm terminology:

> A [manifest](https://helm.sh/docs/helm/helm_get_manifest/) is a YAML-encoded representation of the Kubernetes resources that were generated from a release's chart(s). If a chart is dependent on other charts, those resources will also be included in the manifest.

Getting the manifest of release is just a single step via the `helm` CLI tool:

```text
$ RELEASE_NAME="kube-state-metrics"
$ helm get manifest $RELEASE_NAME
---
# Source: kube-state-metrics/templates/serviceaccount.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  labels:
    app.kubernetes.io/name: kube-state-metrics
    helm.sh/chart: kube-state-metrics-3.5.2
    app.kubernetes.io/managed-by: Helm
...
```

[By default](https://helm.sh/docs/topics/advanced/#storage-backends), this release information is stored as a `Secret` object in the namespace of the release. With a bit of extra effort, we can also extract the manifest via `kubectl` & a few other commonly used CLI tools:

```text
$ RELEASE_SECRET_NAME="sh.helm.release.v1.kube-state-metrics.v1"
$ kubectl get secret $RELEASE_SECRET_NAME -o json \
   | jq ".data.release" -r \
   | base64 -d | base64 -d | gzip -d \
   | jq ".manifest" -r
---
# Source: kube-state-metrics/templates/serviceaccount.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  labels:
    app.kubernetes.io/name: kube-state-metrics
    helm.sh/chart: kube-state-metrics-3.5.2
    app.kubernetes.io/managed-by: Helm
...
```

Fortunately Helm has a Go package ([helm.sh/helm/v3/pkg/action](https://pkg.go.dev/helm.sh/helm/v3/pkg/action)) to obtain the manifest of a specific release, so there wasn't a lot of extra effort involved on my end to implement this portion of the feature.

Finally here's how we can use `kubectl lineage helm` to view the list of Kubernetes objects associated to a release of a [kube-state-metrics](https://artifacthub.io/packages/helm/prometheus-community/kube-state-metrics) Helm chart:

```text
$ RELEASE_NAME="kube-state-metrics"
$ kubectl lineage helm $RELEASE_NAME --depth=1
NAMESPACE    NAME                                                  READY   STATUS     AGE
monitoring   kube-state-metrics                                    True    Deployed   5m
             ├── ClusterRole/kube-state-metrics                    -                  5m
             ├── ClusterRoleBinding/kube-state-metrics             -                  5m
monitoring   ├── Deployment/kube-state-metrics                     1/1                5m
monitoring   ├── Secret/sh.helm.release.v1.kube-state-metrics.v1   -                  5m
monitoring   ├── Service/kube-state-metrics                        -                  5m
monitoring   └── ServiceAccount/kube-state-metrics                 -                  5m
```

## What's next?

I'm currently exploring the idea of going beyond native Kubernetes resources by discovering object relationships for custom resources from incubating or graduated CNCF projects. Some possible examples:

- `Application` from [Argo](https://www.cncf.io/projects/argo/)'s [Argo CD](https://github.com/argoproj/argo-cd).
- `HelmRelease` from [Flux](https://fluxcd.io/)'s [Helm Controller](https://github.com/fluxcd/helm-controller).
- `ScaledObject`, `ScaledJob` & `TriggerAuthentication` from [KEDA](https://keda.sh/).

I would love to get feedback on how to improve `kube-lineage`. If you have any feature suggestion or like to see support for certain custom resource(s), do feel free to create an issue on the project's [GitHub issue page](https://github.com/tohjustin/kube-lineage/issues) or reach out to me on [Twitter](https://twitter.com/tohjustin_)! 🙂
