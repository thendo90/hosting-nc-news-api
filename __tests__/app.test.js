const app = require("../app");
const request = require("supertest");
const seed = require("../db/seeds/seed");
const data = require("../db/data/test-data");
const db = require("../db/connection");

afterAll(() => db.end());
beforeEach(() => seed(data));

describe("app.js", () => {
  test("ALL /* status:404, responds with path not found when invalid path entered", () => {
    return request(app)
      .get("/api/not-a-valid-url")
      .expect(404)
      .then(({ body }) => {
        expect(body).toEqual({ msg: "Path not found" });
      });
  });
  describe("/api/topics", () => {
    describe("GET", () => {
      test("status:200, responds with an array of topic objects", () => {
        return request(app)
          .get("/api/topics")
          .expect(200)
          .then(({ body: { topics } }) => {
            expect(topics.length).toBe(3);
            topics.forEach((topic) =>
              expect(topic).toEqual(
                expect.objectContaining({
                  slug: expect.any(String),
                  description: expect.any(String),
                })
              )
            );
          });
      });
    });
  });
  describe("/api/articles", () => {
    describe("GET", () => {
      test("status:200, responds with an array of articles", () => {
        return request(app)
          .get("/api/articles")
          .expect(200)
          .then(({ body: { articles } }) => {
            expect(articles).toHaveLength(12);
            articles.forEach((article) => {
              expect(article).toEqual(
                expect.objectContaining({
                  article_id: expect.any(Number),
                  title: expect.any(String),
                  topic: expect.any(String),
                  author: expect.any(String),
                  body: expect.any(String),
                  created_at: expect.any(String),
                  votes: expect.any(Number),
                })
              );
            });
          });
      });
      test("status:200, responds with articles sorted by date in descending order (default case)", () => {
        return request(app)
          .get("/api/articles")
          .expect(200)
          .then(({ body: { articles } }) => {
            expect(articles).toBeSorted({
              key: "created_at",
              descending: true,
            });
          });
      });
      test("status:200, response also has key of comment_count with value of how many comments each article has", () => {
        return request(app)
          .get("/api/articles")
          .expect(200)
          .then(({ body: { articles } }) => {
            articles.forEach((article) => {
              expect(article).toEqual(
                expect.objectContaining({
                  comment_count: expect.any(String),
                })
              );
            });
          });
      });
    });
  });
  describe("/api/articles/:article_id", () => {
    describe("GET", () => {
      test("status:200, responds with an article object when passed a valid article_id", () => {
        return request(app)
          .get("/api/articles/1")
          .expect(200)
          .then(({ body: { article } }) => {
            expect(article).toEqual(
              expect.objectContaining({
                article_id: 1,
                title: "Living in the shadow of a great man",
                topic: "mitch",
                author: "butter_bridge",
                body: "I find this existence challenging",
                created_at: expect.any(String),
                votes: 100,
              })
            );
          });
      });
      test("status:200, response also has key of comment_count with value of how many comments an article has", () => {
        return request(app)
          .get("/api/articles/1")
          .expect(200)
          .then(
            ({
              body: {
                article: { comment_count },
              },
            }) => {
              expect(comment_count).toBe("11");
            }
          );
      });
      test("status:400, responds with error message when passed an invalid article_id", () => {
        return request(app)
          .get("/api/articles/seven';-- yo")
          .expect(400)
          .then(({ body }) => {
            expect(body).toEqual(
              expect.objectContaining({
                msg: "Invalid input",
              })
            );
          });
      });
      test("status:404, responds with article not found when passed non-existent article_id", () => {
        return request(app)
          .get("/api/articles/1688")
          .expect(404)
          .then(({ body }) => {
            expect(body).toEqual(
              expect.objectContaining({
                msg: "Article not found",
              })
            );
          });
      });
    });
    describe("PATCH", () => {
      test("status:200, updates the correct article_id with the amount of votes entered and responds with updated article object", () => {
        return request(app)
          .patch("/api/articles/1")
          .send({ inc_votes: 100 })
          .expect(200)
          .then(({ body: { article } }) => {
            expect(article).toEqual(
              expect.objectContaining({
                article_id: 1,
                title: "Living in the shadow of a great man",
                topic: "mitch",
                author: "butter_bridge",
                body: "I find this existence challenging",
                created_at: expect.any(String),
                votes: 200,
              })
            );
          });
      });
      test("status:400, responds with invalid input when passed invalid article_id", () => {
        return request(app)
          .patch("/api/articles/eight")
          .send({ inc_votes: 100 })
          .expect(400)
          .then(({ body }) => {
            expect(body).toEqual(
              expect.objectContaining({
                msg: "Invalid input",
              })
            );
          });
      });
      test("status:400, responds with invalid input when passed invalid patch body (invalid value)", () => {
        return request(app)
          .patch("/api/articles/eight")
          .send({ inc_votes: "not-a-valid-value" })
          .expect(400)
          .then(({ body }) => {
            expect(body).toEqual(
              expect.objectContaining({
                msg: "Invalid input",
              })
            );
          });
      });
      test("status:400, responds with invalid input when passed invalid patch body (invalid key)", () => {
        return request(app)
          .patch("/api/articles/eight")
          .send({ "not a valid key": 100 })
          .expect(400)
          .then(({ body }) => {
            expect(body).toEqual(
              expect.objectContaining({
                msg: "Invalid input",
              })
            );
          });
      });
      test("status:404, responds with article not found when passed non-existent article_id", () => {
        return request(app)
          .patch("/api/articles/1688")
          .send({ inc_votes: 100 })
          .expect(404)
          .then(({ body }) => {
            expect(body).toEqual(
              expect.objectContaining({
                msg: "Article not found",
              })
            );
          });
      });
    });
  });
  describe("/api/articles/:article_id/comments", () => {
    describe("GET", () => {
      test("status:200, responds with an array of comment objects for the given article_id", () => {
        return request(app)
          .get("/api/articles/1/comments")
          .expect(200)
          .then(({ body: { comments } }) => {
            expect(comments).toHaveLength(11);
            comments.forEach((comment) => {
              expect(comment).toEqual(
                expect.objectContaining({
                  comment_id: expect.any(Number),
                  body: expect.any(String),
                  article_id: 1,
                  author: expect.any(String),
                  votes: expect.any(Number),
                  created_at: expect.any(String),
                })
              );
            });
          });
      });
      test("status:200, responds with an empty array when no comments exist for given article_id", () => {
        return request(app)
          .get("/api/articles/2/comments")
          .expect(200)
          .then(({ body: { comments } }) => {
            expect(comments).toEqual([]);
          });
      });
      test("status:400, responds with invalid input when passed invalid article_id", () => {
        return request(app)
          .get("/api/articles/invalid/comments")
          .expect(400)
          .then(({ body }) => {
            expect(body).toEqual(
              expect.objectContaining({
                msg: "Invalid input",
              })
            );
          });
      });
      test("status:404, responds with article not found when passed non-existent article_id", () => {
        return request(app)
          .get("/api/articles/1688/comments")
          .expect(404)
          .then(({ body }) => {
            expect(body).toEqual(
              expect.objectContaining({
                msg: "Article not found",
              })
            );
          });
      });
    });
    describe("POST", () => {
      test("status:201, responds with posted comment", () => {
        return request(app)
          .post("/api/articles/1/comments")
          .send({
            username: "icellusedkars",
            body: "I love cheese, especially stinking bishop cheese on toast. Bocconcini hard cheese babybel cheese on toast smelly cheese roquefort everyone loves bocconcini. Stinking bishop melted cheese babybel cauliflower cheese bocconcini manchego cheese and wine danish fontina. Pecorino danish fontina manchego squirty cheese cheesy feet parmesan.",
          })
          .expect(201)
          .then(({ body: comment }) => {
            expect(comment).toEqual(
              expect.objectContaining({
                body: "I love cheese, especially stinking bishop cheese on toast. Bocconcini hard cheese babybel cheese on toast smelly cheese roquefort everyone loves bocconcini. Stinking bishop melted cheese babybel cauliflower cheese bocconcini manchego cheese and wine danish fontina. Pecorino danish fontina manchego squirty cheese cheesy feet parmesan.",
                votes: 0,
                author: "icellusedkars",
                article_id: 1,
                created_at: expect.any(String),
                comment_id: 19,
              })
            );
          });
      });
      test("status:400, responds with invalid input with post attempt to an invalid article_id", () => {
        return request(app)
          .post("/api/articles/xzibit/comments")
          .send({
            username: "icellusedkars",
            body: "Checkmate... Did he just throw my cat out of the window? You're a very talented young man, with your own clever thoughts and ideas. Do you need a manager? I gave it a cold? I gave it a virus. A computer virus. Yeah, but John, if The Pirates of the Caribbean breaks down, the pirates don’t eat the tourists.",
          })
          .expect(400)
          .then(({ body: { msg } }) => {
            expect(msg).toBe("Invalid input");
          });
      });
      test("status:400, responds with invalid post input when passed a post body with an invalid / missing parameter", () => {
        return request(app)
          .post("/api/articles/1/comments")
          .send({
            usario: "icellusedkars",
            body: "Jaguar shark! So tell me - does it really exist? So you two dig up, dig up dinosaurs? You really think you can fly that thing? Life finds a way. Hey, you know how I'm, like, always trying to save the planet? Here's my chance. You know what? It is beets. I've crashed into a beet truck.",
          })
          .expect(400)
          .then(({ body: { msg } }) => {
            expect(msg).toBe("Invalid post input");
          });
      });
      test("status:400, responds with invalid post data type when passed a post body with incorrect parameter data type", () => {
        return request(app)
          .post("/api/articles/1/comments")
          .send({
            username: 1,
            body: "Jaguar shark! So tell me - does it really exist? So you two dig up, dig up dinosaurs? You really think you can fly that thing? Life finds a way. Hey, you know how I'm, like, always trying to save the planet? Here's my chance. You know what? It is beets. I've crashed into a beet truck.",
          })
          .expect(400)
          .then(({ body: { msg } }) => {
            expect(msg).toBe("Invalid post data type");
          });
      });
      test("status:404, responds with article not found when passed non-existent article_id", () => {
        return request(app)
          .post("/api/articles/1688/comments")
          .send({
            username: "icellusedkars",
            body: "Hey, you know how I'm, like, always trying to save the planet? Here's my chance. Jaguar shark! So tell me - does it really exist? Did he just throw my cat out of the window? Life finds a way. Life finds a way. Hey, take a look at the earthlings. Goodbye!",
          })
          .expect(404)
          .then(({ body: { msg } }) => {
            expect(msg).toBe("Article not found");
          });
      });
    });
  });
});
