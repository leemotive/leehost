
let sender = null;

const broadcast = (name, data) => {
    if (!sender) {
        return;
    }

    sender.send(name, data);
}

exports.registerSender = (r) => {
    sender = r;
}

exports.broadcast = broadcast;
