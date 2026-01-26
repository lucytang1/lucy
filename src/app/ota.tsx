import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import React, { useEffect, useState } from "react";
import { BlogRenderer } from "../lib/parser";
import markdown from '../blogs/Blog1.md';
import Seperator from "../components/Blocks/Seperator";
import { usePostHog } from 'posthog-react-native'

export default function OtaScreen() {
    // const posthog = usePostHog()

    // useEffect(() => {
    //     console.log("PostHog loaded")
    //     posthog.capture("MyComponent loaded", { foo: "bar" })
    // }, [])

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