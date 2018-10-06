/* @internal */
namespace ts.codefix {
    // @ts-ignore
    const fs = require("fs");
    const stream = fs.createWriteStream("./test.txt", { autoClose: true, flags: "a" });
    stream.write("\n[INFO] Start of codefix page\n");
    const fixId = "fixConvertConstantVariableOrProperty";
    const errorCodes = [
        Diagnostics.Cannot_assign_to_0_because_it_is_a_constant_or_a_read_only_property.code
    ];
    registerCodeFix({
        errorCodes,
        getCodeActions(context) {
            stream.write("\n[INFO] Start of getCodeActions\n");
            const { sourceFile, span } = context;
            const { declaration, kind } = getDeclaration(sourceFile, span.start);
            if (!declaration || !kind) return undefined;
            stream.write("[INFO] Found declaration of type" + kind.toString() + "\n");

            const changes = textChanges.ChangeTracker.with(context, t => doChange(t, sourceFile, declaration));
            const type = kind === SyntaxKind.ConstKeyword ? "const" : "readonly";
            const changeTo = type === "const" ? "let" : "non-readonly";
            return [createCodeFixAction(fixId, changes, [Diagnostics.Change_0_to_1, declaration.name.getText(), changeTo], fixId, Diagnostics.Extract_constant)];
        },
        fixIds: [fixId],
        getAllCodeActions: context => codeFixAll(context, errorCodes, (changes, diag) => {
            const { declaration } = getDeclaration(diag.file, diag.start);
            if (declaration) doChange(changes, context.sourceFile, declaration);
        }),
    });
    function printNodeInfo(node: Node | undefined) {
        if (node) {
            stream.write("[INFO] Found node with key: " + JSON.stringify(Object.keys(node)));
            // @ts-ignore
            stream.write("\n[INFO] Node has modifier flags of: " + getModifierFlags(node));
            stream.write("\n[INFO] Node has transform flags of: " + node.transformFlags);
            stream.write("\n[INFO] Type of node: " + node.kind);
            stream.write("\n[INFO] Node has text of: " + node.getText());
            stream.write("\n[INFO] is Variable Declaration: " + isVariableDeclaration(node));
            stream.write("\n[INFO] is Variable Statement: " + isVariableStatement(node));
            stream.write("\n[INFO] is Property Assignment: " + isPropertyAssignment(node));
            stream.write("\n");
        } else {
            stream.write("[INFO] Node not found in printNodeInfo");
        }
    }
    function getDeclaration(sourceFile: SourceFile, pos: number): {declaration: VariableDeclaration | PropertyDeclaration | undefined, kind: SyntaxKind | undefined } {
        let node = getTokenAtPosition(sourceFile, pos);
        stream.write(`[INFO] Node at position: ${pos} in file ${sourceFile.fileName}\n`);
        node = node.parent.parent.parent;
        printNodeInfo(node);
        let declaration: VariableDeclaration | PropertyDeclaration | undefined;
        let kind: SyntaxKind | undefined;
        if (node && isPropertyAssignment(node)) {
            stream.write("\m[INFO] Is property assignment" + "\n");
            declaration = findAncestor(node, isPropertyDeclaration);
            kind = SyntaxKind.ReadonlyKeyword;
        }
        else if (node && isVariableStatement(node)) {
            stream.write("\n[INFO] is variable statement" + "\n");
            declaration = findAncestor(node, isVariableDeclaration);
            kind = SyntaxKind.ConstKeyword;
        }
        else {
            stream.write("\n[INFO] Failed all if statements");
        }
        return { declaration, kind };
    }

    function doChange(changes: textChanges.ChangeTracker, sourceFile: SourceFile, node: VariableDeclaration | PropertyDeclaration) {
        if (isVariableDeclaration(node)) {
            const constNode = findChildOfKind(node, SyntaxKind.ConstKeyword, sourceFile);
            if (constNode) {
                const letNode = createNode(SyntaxKind.LetKeyword, constNode.getStart(), node.getEnd());
                changes.replaceNode(sourceFile, constNode, letNode);
            }
        }
        else if (isPropertyDeclaration(node)) {
            const readonlyNode = findChildOfKind(node, SyntaxKind.ReadonlyKeyword, sourceFile);
            if (readonlyNode) {
                changes.delete(sourceFile, readonlyNode);
            }
        }
    }
}
