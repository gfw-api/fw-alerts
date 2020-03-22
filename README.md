# FW alerts Microservice

[![Build Status](https://travis-ci.org/gfw-api/fw-alerts.svg?branch=develop)](https://travis-ci.org/gfw-api/fw-alerts)
[![Test Coverage](https://api.codeclimate.com/v1/badges/40d4b1e823a36f2041a4/test_coverage)](https://codeclimate.com/github/gfw-api/fw-alerts/test_coverage)

Gets the alerts of an area grouped by geohash precision

1. [Getting Started](#getting-started)

## Getting Started

### OS X

**First, make sure that you have the [API gateway running
locally](https://github.com/control-tower/control-tower).**

We're using Docker which, luckily for you, means that getting the
application running locally should be fairly painless. First, make sure
that you have [Docker Compose](https://docs.docker.com/compose/install/)
installed on your machine.

```
git clone https://github.com/Vizzuality/fw-alerts
cd fw-alerts
./fw-alerts.sh develop
./fw-alerts.sh test
```text

You can now access the microservice through the CT gateway.

```

### Configuration

It is necessary to define these environment variables:

* CT_URL => Control Tower URL
* NODE_ENV => Environment (prod, staging, dev)


### Endpoints availables
* /:datasetSlug/:geostoreId Get the alerts grouped by geohash precision 8 for GLAD or VIIRS

#### Query params
* `days` from now with the following default values:
    * GLAD: 365 (last year)
    * VIIRS: 7 (last data available)
* `output` json by default but also allowed csv format
* `precision` geohash precision to group by
