<script setup lang="ts">
import "./SchemaXml.css";
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue';
import TypesAnalizateXml from '@/services/editXml/TypesAnalizateXml';

const props = defineProps<{
  meta: TypesAnalizateXml.IMetaData
}>();

const emit = defineEmits<{
  (e: "search-req", value: {
    req: string,
    regx: boolean,
  }): void;
}>();
</script>

<template>
  <div class="schema">
    <Disclosure>
      <span>&lt;modifiersGroups&gt; — {{ props.meta.modifiersGroups.quantity }}</span>
      <DisclosureButton class="schema__folder">&lt;modifiersGroup&gt;</DisclosureButton>
      <DisclosurePanel>
        <div class="schema__wrapper">
          <Disclosure>
            <DisclosureButton class="schema__folder">&lt;names&gt;</DisclosureButton>
            <DisclosurePanel>
              <ul class="schema__list">
                <li class="schema__list-item" v-for="item in props.meta.modifiersGroups.names" :key="item.name">
                  <button class="schema__btn"
                    @click="item.searchReq ? emit('search-req', ({ req: item.searchReq, regx: false })) : null">{{
                      item.name }}</button>
                </li>
              </ul>
              <span>&lt;/names&gt;</span>
            </DisclosurePanel>
          </Disclosure>

          <Disclosure>
            <DisclosureButton class="schema__folder">&lt;types&gt;</DisclosureButton>
            <DisclosurePanel>
              <ul class="schema__list">
                <li class="schema__list-item" v-for="type in props.meta.modifiersGroups.types" :key="type.name">
                  <button class="schema__btn"
                    @click="type.searchReq ? emit('search-req', ({ req: type.searchReq, regx: false })) : null">{{
                      type.name }} — {{ type.quantity }}</button>
                </li>
              </ul>
              <span>&lt;/types&gt;</span>
            </DisclosurePanel>
          </Disclosure>
        </div>
        <span>&lt;/modifiersGroup&gt;</span>
      </DisclosurePanel>
      <span>&lt;/modifiersGroups&gt;</span>
    </Disclosure>

    <Disclosure>
      <span>&lt;modifiers&gt; — {{ props.meta.modifiers.quantity }}</span>
      <DisclosureButton class="schema__folder">&lt;modifier&gt;</DisclosureButton>
      <DisclosurePanel>
        <ul class="schema__list">
          <li class="schema__list-item" v-for="item in props.meta.modifiers.names" :key="item.name">
            <button class="schema__btn"
              @click="item.searchReq ? emit('search-req', ({ req: item.searchReq, regx: false })) : null">{{ item.name
              }}</button>
          </li>
        </ul>
        <span>&lt;/modifier&gt;</span>
      </DisclosurePanel>
      <span>&lt;/modifiers&gt;</span>
    </Disclosure>

    <Disclosure>
      <span>&lt;categories&gt; — {{ props.meta.categories.quantity }}</span>
      <DisclosureButton class="schema__folder">&lt;category&gt;</DisclosureButton>
      <DisclosurePanel>
        <ul class="schema__list">
          <li class="schema__list-item" v-for="item in props.meta.categories.names" :key="item.name">
            <button class="schema__btn"
              @click="item.searchReq ? emit('search-req', ({ req: item.searchReq, regx: false })) : null">{{ item.name
              }}</button>
          </li>
        </ul>
        <span>&lt;/category&gt;</span>
      </DisclosurePanel>
      <span>&lt;/categories&gt;</span>
    </Disclosure>

    <Disclosure>
      <span>&lt;offers&gt; — {{ props.meta.offers.quantity }}</span>

      <DisclosureButton class="schema__folder">&lt;offer&gt;</DisclosureButton>
      <DisclosurePanel>
        <div class="schema__wrapper">
          <Disclosure>
            <DisclosureButton class="schema__folder">&lt;names&gt;</DisclosureButton>
            <DisclosurePanel>
              <ul class="schema__list">
                <li class="schema__list-item" v-for="item in props.meta.offers.names" :key="item.name">
                  <button class="schema__btn"
                    @click="item.searchReq ? emit('search-req', ({ req: item.searchReq, regx: false })) : null">{{
                      item.name }}</button>
                </li>
              </ul>
              <span>&lt;/names&gt;</span>
            </DisclosurePanel>
          </Disclosure>

          <Disclosure>
            <DisclosureButton class="schema__folder">&lt;description&gt;</DisclosureButton>
            <DisclosurePanel>
              <div class="schema__wrapper">
                <button class="schema__btn"
                  @click="props.meta.offers.description.searchReq?.true ? emit('search-req', ({ req: props.meta.offers.description.searchReq?.true, regx: true })) : null">true
                  - {{ props.meta.offers.description.true }}/{{ props.meta.offers.quantity }}</button>
                <button class="schema__btn"
                  @click="props.meta.offers.description.searchReq?.false ? emit('search-req', ({ req: props.meta.offers.description.searchReq?.false, regx: true })) : null">false
                  - {{ props.meta.offers.description.false }}/{{ props.meta.offers.quantity }}</button>
              </div>
              <span>&lt;/description&gt;</span>
            </DisclosurePanel>
          </Disclosure>

          <Disclosure>
            <DisclosureButton class="schema__folder">&lt;picture&gt;</DisclosureButton>
            <DisclosurePanel>
              <div class="schema__wrapper">
                <button class="schema__btn"
                  @click="props.meta.offers.picture.searchReq?.true ? emit('search-req', ({ req: props.meta.offers.picture.searchReq?.true, regx: true })) : null">true
                  - {{ props.meta.offers.picture.true }}/{{ props.meta.offers.quantity }}</button>
                <button class="schema__btn"
                  @click="props.meta.offers.picture.searchReq?.false ? emit('search-req', ({ req: props.meta.offers.picture.searchReq?.false, regx: true })) : null">false
                  - {{ props.meta.offers.picture.false }}/{{ props.meta.offers.quantity }}</button>
              </div>
              <span>&lt;/picture&gt;</span>
            </DisclosurePanel>
          </Disclosure>

          <span>&lt;parameters&gt; — {{ props.meta.offers.parameters.quantity }}</span>
          <Disclosure>
            <DisclosureButton class="schema__folder">&lt;parameter&gt;</DisclosureButton>
            <DisclosurePanel>
              <div class="schema__wrapper">
                <Disclosure>
                  <DisclosureButton class="schema__folder">&lt;price&gt;</DisclosureButton>
                  <DisclosurePanel>
                    <div class="schema__wrapper">
                      <button class="schema__btn"
                        @click="props.meta.offers.parameters.price.searchReq?.true ? emit('search-req', ({ req: props.meta.offers.parameters.price.searchReq?.true, regx: true })) : null">true
                        - {{ props.meta.offers.parameters.price.true }}/{{
                          props.meta.offers.parameters.quantity
                        }}</button>
                      <button class="schema__btn"
                        @click="props.meta.offers.parameters.price.searchReq?.false ? emit('search-req', ({ req: props.meta.offers.parameters.price.searchReq?.false, regx: true })) : null">false
                        - {{ props.meta.offers.parameters.price.false }}/{{
                          props.meta.offers.parameters.quantity
                        }}</button>
                    </div>
                    <span>&lt;/price&gt;</span>
                  </DisclosurePanel>
                </Disclosure>

                <Disclosure>
                  <DisclosureButton class="schema__folder">&lt;description&gt;</DisclosureButton>
                  <DisclosurePanel>
                    <div class="schema__wrapper">
                      <button class="schema__btn"
                        @click="props.meta.offers.description.searchReq?.true ? emit('search-req', ({ req: props.meta.offers.description.searchReq?.true, regx: true })) : null">true - {{ props.meta.offers.parameters.description.true }}/{{
                        props.meta.offers.parameters.quantity }}</button>
                      <button class="schema__btn"
                        @click="props.meta.offers.description.searchReq?.false ? emit('search-req', ({ req: props.meta.offers.description.searchReq?.false, regx: true })) : null">false - {{ props.meta.offers.parameters.description.false }}/{{
                        props.meta.offers.parameters.quantity }}</button>
                    </div>
                    <span>&lt;/description&gt;</span>
                  </DisclosurePanel>
                </Disclosure>

                <Disclosure>
                  <DisclosureButton class="schema__folder">&lt;descriptionIndex&gt;</DisclosureButton>
                  <DisclosurePanel>
                    <div class="schema__wrapper">
                      <button class="schema__btn"
                        @click="props.meta.offers.parameters.descriptionIndex.searchReq?.true ? emit('search-req', ({ req: props.meta.offers.parameters.descriptionIndex.searchReq?.true, regx: true })) : null">true - {{ props.meta.offers.parameters.descriptionIndex.true }}/{{
                        props.meta.offers.parameters.quantity }}</button>
                      <button class="schema__btn"
                        @click="props.meta.offers.parameters.descriptionIndex.searchReq?.false ? emit('search-req', ({ req: props.meta.offers.parameters.descriptionIndex.searchReq?.false, regx: true })) : null">false - {{ props.meta.offers.parameters.descriptionIndex.false }}/{{
                        props.meta.offers.parameters.quantity }}</button>
                    </div>
                    <span>&lt;/descriptionIndex&gt;</span>
                  </DisclosurePanel>
                </Disclosure>
                <span>&lt;/parameter&gt;</span>
              </div>

            </DisclosurePanel>
          </Disclosure>

          <Disclosure v-for="param in props.meta.offers.parameters.data" :key="param.quantityParams">
            <DisclosureButton class="schema__folder">&lt;parameter&gt; ({{ param.quantityParams }}) - {{
              param.offersWhoHas }}/{{ props.meta.offers.quantity }}</DisclosureButton>
            <DisclosurePanel>
              <ul class="schema__list">
                <li class="schema__list-item" v-for="item in param.offers" :key="item.name">
                  <button class="schema__btn"
              @click="item.searchReq ? emit('search-req', ({ req: item.searchReq, regx: false })) : null">{{ item.name }}</button>
                </li>
              </ul>
            </DisclosurePanel>
          </Disclosure>

          <span>&lt;/parameters&gt;</span>
        </div>
        <span>&lt;/offer&gt;</span>
      </DisclosurePanel>

      <span>&lt;/offers&gt;</span>
    </Disclosure>
  </div>
</template>
