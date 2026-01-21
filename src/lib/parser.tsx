import React from "react";
import { View, Text, Image, ScrollView, Pressable, Linking } from "react-native";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";

type Node = any;

function H1({children}: {children: React.ReactNode}) {
    return(
        <Text className='font-neo text-mc text-h1 tracking-xs mt-8 mb-4'>{children}</Text>
    )
}

function H2({children}: {children: React.ReactNode}) {
    return(
        <Text className='font-neo text-mc text-h2 tracking-xs my-4'>{children}</Text>
    )
}

function P({children}: {children: React.ReactNode}) {
    return(
        <Text className='font-neo text-white text-sm tracking-tighter my-1'>{children}</Text>
    )
}

function Strong({children}: {children: React.ReactNode}) {
    return(
        <Text className='font-neo text-white text-sm tracking-tighter font-bold'>{children}</Text>
    )
}

function InlineCode({ children }: { children: React.ReactNode }) {
    return (
      <Text className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-[13px] text-neutral-900">
        {children}
      </Text>
    );
  }

  

  function CodeBlock({ code }: { code: string }) {
    return (
      <ScrollView horizontal className="my-5 rounded-xl bg-neutral-900 p-4">
        <Text className="font-mono text-[13px] leading-6 text-neutral-100">
          {code}
        </Text>
      </ScrollView>
    );
  }
  
  function BulletList({ children }: { children: React.ReactNode }) {
    return <View className="px-8 my-4 space-y-4">{children}</View>;
  }
  
  function BulletItem({ children }: { children: React.ReactNode }) {
    return (
        <View className='flex-row items-start'>
            <View className='w-3 h-0.5 bg-mc mr-2 mt-2'></View>
            <Text className='font-neo text-white text-sm tracking-tighter flex-1'>{children}</Text>
        </View>
    );
  }
  
  function BlogImage({ uri, alt }: { uri: string; alt?: string }) {
    return (
      <View className="mt-5 w-full">
        <Image
          source={{ uri }}
          accessibilityLabel={alt ?? "Blog image"}
          style={{ width: '100%', aspectRatio: 16/9 }}
          resizeMode="contain"
        />

      </View>
    );
  }

function Hyperlink({children, href}: {children: React.ReactNode, href: string}) {
    return(
        <Pressable onPress={() => Linking.openURL(href)}>
            <Text className='font-neo text-sm tracking-tighter text-mc underline'>{children}</Text>
        </Pressable>
    )
}

function BlogDate({ date }: { date: string }) {
    return (
        <Text className="font-neo text-neutral-400 text-sm tracking-tighter mb-4">
            {date}
        </Text>
    );
}

function renderChildren(nodes: Node[], keyPrefix: string): React.ReactNode[] {
    return nodes.map((n, i) => renderNode(n, `${keyPrefix}.${i}`)).filter(Boolean);
  }
  
  function getText(node: Node): string {
    if (!node) return "";
    if (node.type === "text") return node.value ?? "";
    if (Array.isArray(node.children)) return node.children.map(getText).join("");
    return "";
  }
  
  function renderNode(node: Node, key: string): React.ReactNode {
    if (!node) return null;
  
    switch (node.type) {
      case "root": {
        const children = node.children ?? [];
        const result: React.ReactNode[] = [];
        
        for (let i = 0; i < children.length; i++) {
          const child = children[i];
          
          // Check if this is a paragraph with @date: right after an H1
          if (
            child.type === "paragraph" &&
            i > 0 &&
            children[i - 1].type === "heading" &&
            children[i - 1].depth === 1
          ) {
            const text = getText(child);
            if (text.startsWith("@date:")) {
              const dateValue = text.replace("@date:", "").trim();
              result.push(<BlogDate key={`${key}.${i}`} date={dateValue} />);
              continue;
            }
          }
          
          result.push(renderNode(child, `${key}.${i}`));
        }
        
        return <View key={key}>{result}</View>;
      }
  
      case "heading": {
        const content = renderChildren(node.children ?? [], key);
        if (node.depth === 1) return <H1 key={key}>{content}</H1>;
        if (node.depth === 2) return <H2 key={key}>{content}</H2>;
        return (
          <Text key={key} className="mt-6 text-xl font-semibold text-neutral-900">
            {content}
          </Text>
        );
      }
  
      case "paragraph":
        return <P key={key}>{renderChildren(node.children ?? [], key)}</P>;
  
      case "strong":
        return <Strong key={key}>{renderChildren(node.children ?? [], key)}</Strong>;
  
      case "emphasis":
        return (
          <Text key={key} className="italic">
            {renderChildren(node.children ?? [], key)}
          </Text>
        );
  
      case "inlineCode":
        return <InlineCode key={key}>{node.value ?? ""}</InlineCode>;
  
      case "code":
        return <CodeBlock key={key} code={node.value ?? ""} />;
  
      case "list":
        return <BulletList key={key}>{renderChildren(node.children ?? [], key)}</BulletList>;
  
      case "listItem": {
        const children = node.children ?? [];
        return <BulletItem key={key}>{renderChildren(children, key)}</BulletItem>;
      }
  
      case "image":
        return <BlogImage key={key} uri={node.url} alt={node.alt} />;
  
      case "link":
        return (
          <Hyperlink key={key} href={node.url}>
            {renderChildren(node.children ?? [], key)}
          </Hyperlink>
        );
  
      case "text":
        return <Text key={key}>{node.value ?? ""}</Text>;
  
      case "thematicBreak":
        return <View key={key} className="my-6 h-px w-full bg-neutral-200" />;
  
      default:
        return null;
    }
  }
  
  export function BlogRenderer({ markdown }: { markdown: string }) {
    const tree = React.useMemo(() => {
      return unified().use(remarkParse).use(remarkGfm).parse(markdown);
    }, [markdown]);
  
    return <View className="px-5">{renderNode(tree, "root")}</View>;
  }