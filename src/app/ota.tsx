import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import React, { useEffect, useState } from "react";
import { BlogRenderer } from "../lib/parser";
import markdown from '../blogs/Blog1.md';
import Seperator from "../components/Blocks/Seperator";

export default function OtaScreen() {

    return (
        <View className="flex-1 bg-vb">
            <ScrollView className='flex-1 w-2/3 self-center px-12 pt-12' showsVerticalScrollIndicator={false}>
                <BlogRenderer markdown={markdown} />
                <Seperator />
            </ScrollView>
        </View>
    );
}