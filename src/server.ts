import express from "express"
import { requireEnv } from "./utils/env";
import { postUpdateNotifyMessage } from "./slack-messaging";
import { receiver } from "./slack-server";

export const repo = {
    owner: requireEnv('GITHUB_REPO_OWNER'),
    name: requireEnv('GITHUB_REPO_NAME'),
};
export const app = express();

app.use(express.json())

app.get("/", (_req, res) => {
    return res.send("hello world");
});

// * listen to slack actions
app.use('/', receiver.router);

const ghRouter = express.Router();
ghRouter.use(express.json());
ghRouter.use(express.urlencoded({ extended: true }));

ghRouter.post("/payload", (req, res) => {
    const ref = req.body.ref;

    // * public new tag -> notify to slack
    // there will be 2 payloads
    // use the one that ref begin with `refs/tags/`
    if (
        ref.startsWith('refs/tags/') &&
        req.body.deleted !== true &&
        req.body.repository.name === repo.name
    ) {
        const tag = ref.split('/')[2];
        // send notify to slack
        postUpdateNotifyMessage(tag);
    }

    return res.sendStatus(200)
});

app.use('/github', ghRouter);