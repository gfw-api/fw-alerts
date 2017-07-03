# FW alerts Microservice


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
* `range` with the following values:
    * GLAD: 1-6 last months (6 by default)
    * VIIRS: 1-7 last days (7 by default)
* `format` json by default but also allowed csv format
