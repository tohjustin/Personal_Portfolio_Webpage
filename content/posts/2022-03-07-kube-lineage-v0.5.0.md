---
title: "kube-lineage v0.5.0"
description: "Filtering objects by resource types."
date: 2022-03-07T21:00:00+08:00
tags: [changelog, helm, kube-lineage, kubectl-plugin, kubernetes]
---

## Filtering objects by resource types

Last month, [vrabbi](https://github.com/vrabbi) raised a [feature request](https://github.com/tohjustin/kube-lineage/issues/3) for the ability to filter out events to make `kube-lineage`'s output clearer to look at. To handle this in a more generic manner, two new flags `--exclude-types` & `--include-types` were introduced so that users can specify one or more resource type(s) to exclude/include when discovering relationships, making the output much easier to grok. These flags are also supported by the `helm` subcommand.

Lets take a [metrics-server](https://github.com/kubernetes-sigs/metrics-server) deployment as an example:

```text
$ kubectl lineage deploy/metrics-server
NAMESPACE     NAME                                                                READY   STATUS                                                                                                                              AGE
kube-system   Deployment/metrics-server                                           1/1                                                                                                                                         5m
kube-system   ├── Event/metrics-server.16da1cfb129975a9                           -       ScalingReplicaSet: Scaled up replica set metrics-server-ff9dbcb6c to 1                                                              5m
kube-system   └── ReplicaSet/metrics-server-ff9dbcb6c                             1/1                                                                                                                                         5m
kube-system       ├── Event/metrics-server-ff9dbcb6c.16da1cfb1b5eafdd             -       SuccessfulCreate: Created pod: metrics-server-ff9dbcb6c-crvm8                                                                       5m
kube-system       └── Pod/metrics-server-ff9dbcb6c-crvm8                          1/1     Running                                                                                                                             5m
kube-system           ├── Event/metrics-server-ff9dbcb6c-crvm8.16da1cfb1eaf3bd1   -       Scheduled: Successfully assigned kube-system/metrics-server-ff9dbcb6c-crvm8 to k3d-k3s-default-server-0                             5m
kube-system           ├── Event/metrics-server-ff9dbcb6c-crvm8.16da1cfe710b6a54   -       Pulling: Pulling image "rancher/mirrored-metrics-server:v0.5.2"                                                                     5m
kube-system           ├── Event/metrics-server-ff9dbcb6c-crvm8.16da1d034b34b8be   -       Pulled: Successfully pulled image "rancher/mirrored-metrics-server:v0.5.2" in 20.861236434s                                         5m
kube-system           ├── Event/metrics-server-ff9dbcb6c-crvm8.16da1d03556367df   -       Created: Created container metrics-server                                                                                           5m
kube-system           ├── Event/metrics-server-ff9dbcb6c-crvm8.16da1d0363753c75   -       Started: Started container metrics-server                                                                                           5m
kube-system           ├── Event/metrics-server-ff9dbcb6c-crvm8.16da1d036921f8ff   -       Unhealthy: Readiness probe failed: Get "https://10.42.0.6:4443/readyz": dial tcp 10.42.0.6:4443: connect: connection refused (x2)   5m
kube-system           ├── Event/metrics-server-ff9dbcb6c-crvm8.16da1d03f856d6d8   -       Unhealthy: Readiness probe failed: HTTP probe failed with statuscode: 500 (x8)                                                      5m
kube-system           └── Service/metrics-server                                  -                                                                                                                                           5m
                          ├── APIService/v1beta1.metrics.k8s.io                   True                                                                                                                                        5m
kube-system               └── EndpointSlice/metrics-server-hvjk2                  -
```

Often we aren't too interested with `Event` resources, now we can simply omit them from the output via the `--exclude-types` flag:

```text
$ kubectl lineage deploy/metrics-server --exclude-types event
NAMESPACE     NAME                                                 READY   STATUS    AGE
kube-system   Deployment/metrics-server                            1/1               5m
kube-system   └── ReplicaSet/metrics-server-ff9dbcb6c              1/1               5m
kube-system       └── Pod/metrics-server-ff9dbcb6c-crvm8           1/1     Running   5m
kube-system           └── Service/metrics-server                   -                 5m
                          ├── APIService/v1beta1.metrics.k8s.io    True              5m
kube-system               └── EndpointSlice/metrics-server-hvjk2   -                 5m
```

Sometimes we're only interested in a certain set of resource types:

> "What `ClusterRole`, `ClusterRoleBinding`, `Role`, `RoleBinding` & `ServiceAccount` does our `traefik` Helm release have?"

For this particular case, we can use the `--include-types` flag to specify the list of resources types that we're only interested in:

```text
$ kubectl lineage helm traefik \
    --depth 1 \
    --include-types ClusterRole,ClusterRoleBinding \
    --include-types Role,RoleBinding \
    --include-types sa
NAMESPACE     NAME                                 READY   STATUS     AGE
kube-system   traefik                              True    Deployed   5m
              ├── ClusterRole/traefik              -                  5m
              ├── ClusterRoleBinding/traefik       -                  5m
kube-system   └── ServiceAccount/traefik           -                  5m
```

Note that the `--exclude-types` & `--include-types` flags are rather flexible on the inputs, users can specify resources types in various formats. The following list of examples yields the same result:

```text
kubectl lineage deployment/metrics-server --exclude-types=ev
kubectl lineage deployment/metrics-server --exclude-types=ev.events.k8s.io
kubectl lineage deployment/metrics-server --exclude-types=event
kubectl lineage deployment/metrics-server --exclude-types=event.events.k8s.io
kubectl lineage deployment/metrics-server --exclude-types=events
kubectl lineage deployment/metrics-server --exclude-types=events.events.k8s.io
kubectl lineage deployment/metrics-server --exclude-types=Event
kubectl lineage deployment/metrics-server --exclude-types=Event.events.k8s.io
kubectl lineage deployment/metrics-server --exclude-types=Events
kubectl lineage deployment/metrics-server --exclude-types=Events.events.k8s.io
```

## Fixes & improvements

- Fix `helm` subcommand crashes when client does not have permission to list Secrets
