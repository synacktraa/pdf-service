## PDF reader service
> I crafted this for my own enjoyment, involving the chunking of PDFs and their storage in a vector store for Retrieval-Augmented Generation (RAG) purposes.

## Installation
> Make sure [node](https://nodejs.org/en/download/package-manager) is already installed.

```sh
git clone git@github.com:synacktraa/pdf-service.git
```

## Serve the API

```sh
npm run serve
```
> Visit `/endpoints` for documentation.

#### Run the test

```sh
npm run test
```

### As a docker service

- Build the image
 ```sh
 docker build -t pdf-service .
 ```

- Run the image
 ```sh
 docker run -p 3000:3000 pdf-service
 ```
 > Make sure to update `-p` value accordingly if you're using `--env-file .env` 
