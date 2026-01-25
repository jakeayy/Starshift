export const meta = {
    name: "Test Mod",
    author: "jakeayy",
    description: "It does nothing... yet",
    settings: {
        label_test: {
            title: "(Label Test)",
            description: "Should work as simple text",
            type: "label"
        },
        // bool_test: {
        //     title: "Boolean Test",
        //     description: "True/false option",
        //     type: "boolean",
        //     default: true
        // },
        pick_test: {
            title: "Pick Test",
            description: "Pick between 2",
            type: "pick",
            choices: ["lorem", "ipsum"]
        },
        pick_test_2: {
            title: "Pick Test 2",
            description: "Pick between more than 2",
            type: "pick",
            choices: ["lorem", "ipsum", "sit", "hamet"],
        },
        scale_test: {
            title: "Scale Test",
            description: "Pick between 0-10 in 1 step",
            type: "scale",
            min: 0,
            max: 10,
            step: 1,
            default: 1
        },
        scale_test_2: {
            title: "Scale Test 2",
            description: "Pick between 0-100 in 10 step with percent suffix",
            type: "scale",
            min: 0,
            max: 100,
            step: 10,
            suffix: "%"
        }
    }
}