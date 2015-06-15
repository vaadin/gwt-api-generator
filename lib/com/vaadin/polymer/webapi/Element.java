package com.vaadin.polymer.webapi;

import com.vaadin.polymer.elemental.CSSStyleDeclaration;

import com.google.gwt.core.client.js.JsProperty;
import com.google.gwt.core.client.js.JsType;

@JsType
public interface Element extends Node {

    @JsProperty
    String getInnerHTML();

    @JsProperty
    DOMTokenList getClassList();

    @JsProperty
    CSSStyleDeclaration getStyle();

    void setAttribute(String name, Object value);
    String getAttribute(String name);
    boolean hasAttribute(String name);
    void removeAttribute(String name);
}
