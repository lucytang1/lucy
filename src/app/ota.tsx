import { View, ScrollView } from "react-native";
import React from "react";
import { BlogRenderer } from "../lib/parser";
import markdown from '../blogs/Blog1.md';
import Seperator from "../components/Blocks/Seperator";

export default function OtaScreen() {
    // NOTE: PostHog removed from static imports — it breaks web SSR
    // (`window is not defined`). Re-add via dynamic import inside
    // useEffect guarded by `typeof window !== 'undefined'` if needed.

    return (
        <View className="flex-1 bg-vb">
            <ScrollView
                className="flex-1 w-full lg:w-2/3 self-center max-w-4xl px-4 sm:px-4 md:px-6 lg:px-12 pt-12"
                // className='flex-1 w-2/3 self-center px-12 pt-12'
                showsVerticalScrollIndicator={false}
            >
                <BlogRenderer markdown={markdown} />
                <Seperator />
            </ScrollView>
        </View>
    );
}